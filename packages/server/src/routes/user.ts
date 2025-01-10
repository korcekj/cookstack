import type { Env } from '../types';

import {
  userSchema,
  imageSchema,
  getRoleRequestsSchema,
  createRoleRequestSchema,
} from '@cs/utils/zod';
import { Hono } from 'hono';
import {
  users,
  roleRequests as roleRequestsTable,
} from '../services/db/schema';
import { initializeDB } from '../services/db';
import { verifyAuth } from '../middlewares/auth';
import { generateId } from '@cs/utils/generators';
import { initializeAuth } from '../services/auth';
import { eq, getTableColumns } from 'drizzle-orm';
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

    const auth = initializeAuth(c);
    const db = initializeDB(c.env.DB);

    const slug = auth.slugify({ userId: user.id, firstName, lastName });

    await db
      .update(users)
      .set({ slug, firstName, lastName, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return c.json({ ...user, slug, firstName, lastName });
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

  await db
    .update(users)
    .set({ imageUrl, updatedAt: new Date() })
    .where(eq(users.id, user.id));

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

roleRequests.post('/', validator('json', createRoleRequestSchema), async c => {
  const { t } = c.get('i18n');
  const user = c.get('user')!;
  const { role } = c.req.valid('json');

  if (user.role === role) return c.json({ error: t('errors.badRequest') }, 400);

  const mail = initializeEmail(c);
  const db = initializeDB(c.env.DB);

  const id = generateId(16);
  const { userId, ...columns } = getTableColumns(roleRequestsTable);

  try {
    const [[request], admins] = await db.batch([
      db
        .insert(roleRequestsTable)
        .values({ id, role, userId: user.id })
        .returning(columns),
      db.query.users.findMany({ where: (t, { eq }) => eq(t.role, 'admin') }),
    ]);

    c.executionCtx.waitUntil(
      Promise.all(
        admins.map(({ email }) =>
          mail.send({
            from: mail.senders.notifications,
            to: email,
            subject: t('emails.roleRequest.subject'),
            html: mail.templates.roleRequest({ id, role }),
          }),
        ),
      ),
    );

    return c.json(request, 201);
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
