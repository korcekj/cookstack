import type { Env } from '../types';

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { setCookie } from 'hono/cookie';
import { userSchema } from '@cs/utils/zod';
import { initializeDB } from '../services/db';
import { users } from '../services/db/schema';
import { initializeAuth } from '../services/auth';
import { rateLimit } from '../middlewares/rate-limit';
import { validator } from '../middlewares/validation';
import { verifyAuth, makeAuthor } from '../middlewares/auth';

const user = new Hono<Env>();
const author = new Hono<Env>();
const profile = new Hono<Env>();

author.use(rateLimit);
author.post('/', makeAuthor, async c => {
  const user = c.get('user')!;

  const db = initializeDB(c.env.DB);
  const { lucia } = initializeAuth(c);

  await lucia.invalidateUserSessions(user.id);
  await db.update(users).set({ role: 'author' }).where(eq(users.id, user.id));

  const session = await lucia.createSession(user.id, {});
  const cookie = lucia.createSessionCookie(session.id);

  setCookie(c, cookie.name, cookie.value, cookie.attributes);

  const { user: luciaUser } = await lucia.validateSession(session.id);
  return c.json({ user: luciaUser });
});

profile.get('/', async c => {
  const user = c.get('user')!;
  return c.json({ user });
});

profile.patch(
  '/',
  validator('json', userSchema.pick({ firstName: true, lastName: true })),
  async c => {
    const user = c.get('user')!;
    const { firstName, lastName } = c.req.valid('json');

    const db = initializeDB(c.env.DB);
    await db
      .update(users)
      .set({ firstName, lastName })
      .where(eq(users.id, user.id));

    return c.json({ user: { ...user, firstName, lastName } });
  },
);

user.use(verifyAuth);
user.route('/author', author);
user.route('/profile', profile);

export default user;
