import type { Env } from '../types';

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

export const verifyAuth = createMiddleware<Env>(async (c, next) => {
  const t = useTranslation(c);
  const session = c.get('session');
  if (!session) {
    throw new HTTPException(401, { message: t('auth.unauthorized') });
  }

  return next();
});

export const verifyAuthor = createMiddleware<Env>(async (c, next) => {
  const t = useTranslation(c);

  await verifyAuth(c, () => {
    const user = c.get('user')!;
    if (user.role !== 'author') {
      throw new HTTPException(403, { message: t('auth.forbidden') });
    }

    return next();
  });
});

export const makeAuthor = createMiddleware<Env>(async (c, next) => {
  const t = useTranslation(c);

  // TODO: Make this safer
  const author = c.req.header('x-author');
  if (!author) {
    throw new HTTPException(400, { message: t('errors.badRequest') });
  }

  await verifyAuth(c, () => {
    const user = c.get('user')!;
    if (user.role === 'author') {
      throw new HTTPException(400, { message: t('auth.existsAuthor') });
    }

    return next();
  });
});
