import type { Role, RoleRequest } from '@cs/utils/zod';

import { eq } from 'drizzle-orm';
import { sha256 } from '@cs/utils';
import { env } from 'cloudflare:test';
import {
  users,
  recipes,
  categories,
  roleRequests,
  passwordResetTokens,
} from '../../src/services/db/schema';
import { createDate, TimeSpan } from 'oslo';
import { generateId } from '@cs/utils/generators';
import { initializeDB } from '../../src/services/db';

export const getVerificationCode = async (userId: string) => {
  const db = initializeDB(env.DB);
  const { code } =
    (await db.query.emailVerificationCodes.findFirst({
      where: (t, { eq }) => eq(t.userId, userId),
    })) ?? {};

  return code;
};

export const getPasswordResetToken = async (userId: string) => {
  const token = generateId(40);
  const hashedToken = sha256(token);
  const db = initializeDB(env.DB);
  await db.batch([
    db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId!)),
    db.insert(passwordResetTokens).values({
      userId,
      hashedToken,
      expiresAt: createDate(new TimeSpan(2, 'h')),
    }),
  ]);
  return token;
};

export const setRole = async (userId: string, role: Role) => {
  const db = initializeDB(env.DB);
  await db.update(users).set({ role }).where(eq(users.id, userId));
};

export const setRoleRequest = async (
  requestId: string,
  roleRequest: Partial<RoleRequest>,
) => {
  const db = initializeDB(env.DB);
  await db
    .update(roleRequests)
    .set(roleRequest)
    .where(eq(roleRequests.id, requestId));
};

export const deleteRoleRequests = async () => {
  const db = initializeDB(env.DB);
  await db.delete(roleRequests);
};

export const deleteRecipes = async () => {
  const db = initializeDB(env.DB);
  await db.delete(recipes);
};

export const deleteCategories = async () => {
  const db = initializeDB(env.DB);
  await db.delete(categories);
};
