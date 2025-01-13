import type { Env } from '../types';

import { Hono } from 'hono';
import {
  users,
  roleRequests as roleRequestsTable,
} from '../services/db/schema';
import { eq } from 'drizzle-orm';
import { initializeDB } from '../services/db';
import { log } from '../middlewares/analytics';
import { initializeAuth } from '../services/auth';
import rateLimit from '../middlewares/rate-limit';
import { initializeEmail } from '../services/email';
import { verifyAuth, verifyRoles } from '../middlewares/auth';
import { useRoleRequest, useRoleRequests } from '../services/db/queries';
import { validator, validateRoleRequest } from '../middlewares/validation';
import { updateRoleRequestSchema, getRoleRequestsSchema } from '@cs/utils/zod';

const admin = new Hono<Env>();
const roleRequests = new Hono<Env>();

roleRequests.use(rateLimit);

roleRequests.get('/', validator('query', getRoleRequestsSchema), async c => {
  const options = c.req.valid('query');
  const { limit, offset } = options;

  const { requests, total } = await useRoleRequests(c, options);
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);

  return c.json({ requests, total, page, pages });
});

roleRequests.post(
  '/:requestId/:status',
  log('admin', 'Role request update attempt'),
  validator('param', updateRoleRequestSchema),
  validateRoleRequest,
  async c => {
    const { t } = c.get('i18n');
    const { requestId, status } = c.req.valid('param');

    const mail = initializeEmail(c);
    const db = initializeDB(c.env.DB);

    const [request] = await useRoleRequest(c, { requestId });

    const [_1, ...get1] = await db.batch([
      db
        .update(roleRequestsTable)
        .set({ status, updatedAt: new Date() })
        .where(eq(roleRequestsTable.id, requestId)),
      ...(status === 'approved'
        ? [
            db
              .update(users)
              .set({ role: request.role, updatedAt: new Date() })
              .where(eq(users.id, request.user!.id)),
          ]
        : []),
      useRoleRequest(c, { requestId }),
    ]);

    if (status === 'approved') {
      const { lucia } = initializeAuth(c);
      await lucia.invalidateUserSessions(request.user!.id);
    }

    c.executionCtx.waitUntil(
      mail.send({
        from: mail.senders.notifications,
        to: request.user!.email,
        subject: t('emails.roleRequestStatus.subject'),
        html: mail.templates.roleRequestStatus({
          id: requestId,
          role: request.role,
          status,
        }),
      }),
    );

    const [results] = get1.filter(v => Array.isArray(v)).map(v => v[0]);
    return c.json(results);
  },
);

admin.use(verifyAuth);
admin.use(verifyRoles(['admin']));
admin.route('/role-requests', roleRequests);

export default admin;
