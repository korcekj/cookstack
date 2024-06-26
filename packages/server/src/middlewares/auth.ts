import type { Env } from '../types';

import { initializeLucia } from '../services/auth';
import { useTranslation } from '@intlify/hono';
import { createMiddleware } from 'hono/factory';
import { setCookie, getCookie } from 'hono/cookie';

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
  if (!session) return c.json({ error: t('errors.unauthorized') }, 401);

  return next();
});
