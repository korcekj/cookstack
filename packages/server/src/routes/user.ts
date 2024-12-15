import type { Env } from '../types';

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { generateId } from '@cs/utils';
import { initializeDB } from '../services/db';
import { verifyAuth } from '../middlewares/auth';
import rateLimit from '../middlewares/rate-limit';
import { initializeEmail } from '../services/email';
import { initializeImage } from '../services/image';
import { users, roleRequests } from '../services/db/schema';
import { validator, validateRole } from '../middlewares/validation';
import { userSchema, roleRequestSchema, imageSchema } from '@cs/utils/zod';

const user = new Hono<Env>();
const role = new Hono<Env>();
const profile = new Hono<Env>();

role.use(rateLimit);

role.post('/', validator('json', roleRequestSchema), validateRole, async c => {
  const { t } = c.get('i18n');
  const user = c.get('user')!;
  const { role } = c.req.valid('json');

  const db = initializeDB(c.env.DB);
  const mail = initializeEmail(c);

  const id = generateId(16);

  try {
    const [[request], admins] = await db.batch([
      db
        .insert(roleRequests)
        .values({ id, role, userId: user.id })
        .returning({ status: roleRequests.status }),
      db.query.users.findMany({ where: (t, { eq }) => eq(t.role, 'admin') }),
    ]);

    c.executionCtx.waitUntil(
      Promise.all(
        admins.map(({ email }) =>
          mail.send({
            to: email,
            subject: t('emails.roleRequest.subject'),
            html: mail.templates.roleRequest({ id, role }),
          }),
        ),
      ),
    );

    return c.json({ id, role, status: request.status });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('D1_ERROR: UNIQUE')) {
        return c.json({ error: t('auth.roleRequested') }, 409);
      }
    }

    throw err;
  }
});

role.get('/pending', async c => {
  const user = c.get('user')!;

  const db = initializeDB(c.env.DB);

  const pending = await db.query.roleRequests.findMany({
    columns: { id: true, role: true, status: true, createdAt: true },
    where: (t, { and, eq }) =>
      and(eq(t.userId, user.id), eq(t.status, 'pending')),
  });

  return c.json(pending);
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
user.route('/role', role);
user.route('/profile', profile);

export default user;
