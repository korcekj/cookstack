import type { Env } from '../types';

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { setCookie } from 'hono/cookie';
import { initializeDB } from '../services/db';
import { users } from '../services/db/schema';
import { initializeAuth } from '../services/auth';
import { rateLimit } from '../middlewares/rate-limit';
import { cache, invalidateKey } from '../middlewares/cache';
import { verifyAuth, makeAuthor } from '../middlewares/auth';

const user = new Hono<Env>();
const author = new Hono<Env>();
const profile = new Hono<Env>();

author.use(rateLimit);
author.post('/', makeAuthor, async (c) => {
  const user = c.get('user')!;

  const db = initializeDB(c.env.DB);
  const { lucia } = initializeAuth(c);

  await invalidateKey(c, `user:${user.id}`);
  await lucia.invalidateUserSessions(user.id);
  await db.update(users).set({ role: 'author' }).where(eq(users.id, user.id));

  const session = await lucia.createSession(user.id, {});
  const cookie = lucia.createSessionCookie(session.id);

  setCookie(c, cookie.name, cookie.value, cookie.attributes);

  const { user: luciaUser } = await lucia.validateSession(session.id);
  return c.json({ user: luciaUser });
});

profile.get('/', async (c) => {
  const user = c.get('user')!;
  return c.json({ user });
});

user.use(
  cache({
    keyGenerator: (c) => `user:${c.get('user')?.id}`,
  }),
  verifyAuth
);
user.route('/author', author);
user.route('/profile', profile);

export default user;
