import type { Role } from '@cs/utils/zod';

import { eq } from 'drizzle-orm';
import { env } from 'cloudflare:test';
import {
  users,
  recipes,
  categories,
  passwordResetTokens,
} from '../../src/services/db/schema';
import { createDate, TimeSpan } from 'oslo';
import { sha256, generateId } from '@cs/utils';
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

export const deleteRecipes = async () => {
  const db = initializeDB(env.DB);
  await db.delete(recipes);
};

export const deleteCategories = async () => {
  const db = initializeDB(env.DB);
  await db.delete(categories);
};
