import type { Env } from '../types';

import {
  userSchema,
  imageSchema,
  roleRequestSchema,
  getRoleRequestsSchema,
} from '@cs/utils/zod';
import { Hono } from 'hono';
import {
  users,
  roleRequests as roleRequestsTable,
} from '../services/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@cs/utils';
import { initializeDB } from '../services/db';
import { verifyAuth } from '../middlewares/auth';
import rateLimit from '../middlewares/rate-limit';
import { initializeEmail } from '../services/email';
import { initializeImage } from '../services/image';
import { validator } from '../middlewares/validation';
import { useRoleRequests } from '../services/db/queries';

const user = new Hono<Env>();
const profile = new Hono<Env>();
const roleRequests = new Hono<Env>();

profile.get('/', async c => {
  const user = c.get('user');
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

roleRequests.use(rateLimit);

roleRequests.get('/', validator('query', getRoleRequestsSchema), async c => {
  const user = c.get('user')!;
  const options = c.req.valid('query');

  const { limit, offset } = options;

  const { requests, total } = await useRoleRequests(c, {
    ...options,
    userId: user.id,
  });
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);

  return c.json({ requests, total, page, pages });
});

roleRequests.post('/', validator('json', roleRequestSchema), async c => {
  const { t } = c.get('i18n');
  const user = c.get('user')!;
  const { role } = c.req.valid('json');

  if (user.role === role) return c.json({ error: t('errors.badRequest') }, 400);

  const db = initializeDB(c.env.DB);
  const mail = initializeEmail(c);

  const id = generateId(16);

  try {
    const [[request], admins] = await db.batch([
      db
        .insert(roleRequestsTable)
        .values({ id, role, userId: user.id })
        .returning({ status: roleRequestsTable.status }),
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
        return c.json({ error: t('roleRequest.duplicate') }, 409);
      }
    }

    throw err;
  }
});

user.use(verifyAuth);
user.route('/profile', profile);
user.route('/role-requests', roleRequests);

export default user;
