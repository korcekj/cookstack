import type { Env } from '../types';
import type { Role } from '@cs/utils/zod';
import type { MiddlewareHandler } from 'hono';

import { getIp } from '../utils';
import { every, some } from 'hono/combine';
import { bearerAuth } from 'hono/bearer-auth';
import { createMiddleware } from 'hono/factory';
import { initializeAuth } from '../services/auth';
import { setCookie, getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';

export const handleAuth = createMiddleware<Env>(async (c, next) => {
  const sentry = c.get('sentry');

  const ip = getIp(c);
  const { lucia } = initializeAuth(c);
  const sessionId = getCookie(c, lucia.sessionCookieName) ?? null;
  if (!sessionId) {
    sentry.setUser({ ip_address: ip });
    c.set('user', null);
    c.set('session', null);
    return next();
  }

  const { session, user } = await lucia.validateSession(sessionId);
  if (session && session.fresh) {
    const cookie = lucia.createSessionCookie(session.id);
    setCookie(c, cookie.name, cookie.value, cookie.attributes);
  }
  if (!session) {
    const cookie = lucia.createBlankSessionCookie();
    setCookie(c, cookie.name, cookie.value, cookie.attributes);
  }

  sentry.setUser({ ...user, ip_address: ip });
  c.set('user', user);
  c.set('session', session);

  return next();
});

export const handleBearerAuth = (token: string) =>
  bearerAuth({
    token,
    noAuthenticationHeaderMessage: c => {
      const { t } = c.get('i18n');
      throw new HTTPException(401, { message: t('auth.invalidHeader') });
    },
    invalidAuthenticationHeaderMessage: c => {
      const { t } = c.get('i18n');
      throw new HTTPException(400, { message: t('auth.invalidToken') });
    },
    invalidTokenMessage: c => {
      const { t } = c.get('i18n');
      throw new HTTPException(400, { message: t('auth.invalidToken') });
    },
  });

export const verifyAuth = createMiddleware<Env>((c, next) => {
  const { t } = c.get('i18n');
  const session = c.get('session');
  if (!session) {
    throw new HTTPException(401, { message: t('auth.unauthorized') });
  }

  return next();
});

export const verifyRoles = (roles: Role[]) =>
  every(
    verifyAuth,
    createMiddleware<Env>((c, next) => {
      const { t } = c.get('i18n');

      const user = c.get('user')!;
      if (!roles.includes(user.role)) {
        throw new HTTPException(403, { message: t('auth.forbidden') });
      }

      return next();
    }),
  );

export const verifyAuthor = (...middlewares: MiddlewareHandler[]) =>
  some(
    every(
      verifyAuth,
      createMiddleware<Env>((c, next) => {
        const { t } = c.get('i18n');
        const user = c.get('user')!;
        const author = c.get('author');

        if (user.id !== author?.id) {
          throw new HTTPException(403, { message: t('auth.forbidden') });
        }

        return next();
      }),
    ),
    ...middlewares,
  );
