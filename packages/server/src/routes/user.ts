import type { Env } from '../types';

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { setCookie } from 'hono/cookie';
import { generateId } from '@cs/utils';
import { initializeDB } from '../services/db';
import { users } from '../services/db/schema';
import { initializeAuth } from '../services/auth';
import rateLimit from '../middlewares/rate-limit';
import { initializeImage } from '../services/image';
import { validator } from '../middlewares/validation';
import { userSchema, imageSchema } from '@cs/utils/zod';
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
  return c.json(luciaUser);
});

profile.get('/', async c => {
  const user = c.get('user')!;
  return c.json(user);
});

profile.patch(
  '/',
  rateLimit,
  validator('json', userSchema.pick({ firstName: true, lastName: true })),
  async c => {
    const user = c.get('user')!;
    const { firstName, lastName } = c.req.valid('json');

    const db = initializeDB(c.env.DB);
    await db
      .update(users)
      .set({ firstName, lastName })
      .where(eq(users.id, user.id));

    return c.json({ ...user, firstName, lastName });
  },
);

profile.put('/image', rateLimit, validator('form', imageSchema), async c => {
  const user = c.get('user')!;
  const { image: file } = c.req.valid('form');

  const db = initializeDB(c.env.DB);
  const image = initializeImage(c);

  const imageId = generateId(16);

  const {
    eager: [{ secure_url: imageUrl }],
  } = await image.upload(file, {
    publicId: imageId,
    folder: `cookstack/${c.env.ENV}/users`,
    uploadPreset: 'cookstack',
  });

  await db.update(users).set({ imageUrl }).where(eq(users.id, user.id));

  return c.json({ id: imageId, url: imageUrl });
});

user.use(verifyAuth);
user.route('/author', author);
user.route('/profile', profile);

export default user;
