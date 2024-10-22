import type { Env } from '../types';

import { every } from 'hono/combine';
import { bearerAuth } from 'hono/bearer-auth';
import { useTranslation } from '@intlify/hono';
import { createMiddleware } from 'hono/factory';
import { setCookie, getCookie } from 'hono/cookie';
import { initializeLucia } from '../services/auth';
import { HTTPException } from 'hono/http-exception';

export const handleAuth = createMiddleware<Env>(async (c, next) => {
  const lucia = initializeLucia(c);
  const sessionId = getCookie(c, lucia.sessionCookieName) ?? null;
  if (!sessionId) {
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

  c.set('user', user);
  c.set('session', session);

  return next();
});

export const handleBearerAuth = (token: string) =>
  bearerAuth({
    token,
    noAuthenticationHeaderMessage: (c) => {
      const t = useTranslation(c);
      throw new HTTPException(401, { message: t('auth.invalidHeader') });
    },
    invalidAuthenticationHeaderMessage: (c) => {
      const t = useTranslation(c);
      throw new HTTPException(400, { message: t('auth.invalidToken') });
    },
    invalidTokenMessage: (c) => {
      const t = useTranslation(c);
      throw new HTTPException(400, { message: t('auth.invalidToken') });
    },
  });

export const verifyAuth = createMiddleware<Env>(async (c, next) => {
  const t = useTranslation(c);
  const session = c.get('session');
  if (!session) {
    throw new HTTPException(401, { message: t('auth.unauthorized') });
  }

  return next();
});

export const verifyAuthor = every(
  verifyAuth,
  createMiddleware<Env>(async (c, next) => {
    const t = useTranslation(c);

    const user = c.get('user')!;
    if (user.role !== 'author') {
      throw new HTTPException(403, { message: t('auth.forbidden') });
    }

    return next();
  })
);

export const makeAuthor = every(
  verifyAuth,
  createMiddleware<Env>(async (c, next) => {
    const bearer = handleBearerAuth(c.env.AUTH_AUTHOR_TOKEN);
    return bearer(c, next);
  }),
  createMiddleware<Env>(async (c, next) => {
    const t = useTranslation(c);

    const user = c.get('user')!;
    if (!user.emailVerified) {
      throw new HTTPException(400, { message: t('auth.unverifiedEmail') });
    }
    if (user.role === 'author') {
      throw new HTTPException(400, { message: t('auth.existsAuthor') });
    }

    return next();
  })
);
