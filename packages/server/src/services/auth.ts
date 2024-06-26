import type { Context } from 'hono';
import type { Env } from '../types';
import type { User } from '../db/schema';
import type { ArgonOpts } from '@noble/hashes/argon2';

import { Google } from 'arctic';
import { eq } from 'drizzle-orm';
import { initializeDB } from '../db';
import { sha256 } from '@noble/hashes/sha256';
import { argon2id } from '@noble/hashes/argon2';
import { bytesToHex } from '@noble/hashes/utils';
import { Lucia, generateIdFromEntropySize } from 'lucia';
import { generateRandomString, alphabet } from 'oslo/crypto';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { TimeSpan, createDate, isWithinExpirationDate } from 'oslo';

import {
  users,
  sessions,
  emailVerificationCodes,
  passwordResetTokens,
} from '../db/schema';

declare module 'lucia' {
  interface Register {
    Lucia: ReturnType<typeof initializeLucia>;
    DatabaseUserAttributes: Omit<User, 'hashedPassword'>;
  }
}

export const initializeLucia = (c: Context<Env>) => {
  const adapter = new DrizzleSQLiteAdapter(
    initializeDB(c.env.DB),
    sessions,
    users
  );
  return new Lucia(adapter, {
    getUserAttributes: (attributes) => ({
      id: attributes.id,
      email: attributes.email,
      emailVerified: attributes.emailVerified,
      firstName: attributes.firstName,
      lastName: attributes.lastName,
      imageUrl: attributes.imageUrl,
      createdAt: attributes.createdAt,
      updatedAt: attributes.updatedAt,
    }),
    sessionExpiresIn: new TimeSpan(30, 'd'), // 30 days
    sessionCookie: {
      attributes: {
        secure: c.env.ENV === 'production',
      },
    },
  });
};

export const initializeGoogle = (c: Context<Env>) => {
  return new Google(
    c.env.GOOGLE_CLIENT_ID!,
    c.env.GOOGLE_CLIENT_SECRET!,
    c.env.GOOGLE_REDIRECT_URL!
  );
};

export const generateEmailVerificationCode = async (
  DB: D1Database,
  { userId, email }: { userId: string; email: string }
) => {
  const db = initializeDB(DB);
  await db
    .delete(emailVerificationCodes)
    .where(eq(emailVerificationCodes.userId, userId));
  const id = generateIdFromEntropySize(10);
  const code = generateRandomString(8, alphabet('0-9'));
  await db.insert(emailVerificationCodes).values({
    id,
    userId,
    email,
    code,
    expiresAt: createDate(new TimeSpan(15, 'm')),
  });
  return code;
};

export const verifyEmailVerificationCode = async (
  DB: D1Database,
  { userId, email, code }: { userId: string; email: string; code: string }
) => {
  const db = initializeDB(DB);
  const validCode = await db.query.emailVerificationCodes.findFirst({
    where: (table, { eq }) => eq(table.userId, userId),
  });
  if (!validCode || validCode.code !== code) return false;

  await db
    .delete(emailVerificationCodes)
    .where(eq(emailVerificationCodes.id, validCode.id));

  if (!isWithinExpirationDate(validCode.expiresAt)) return false;
  return validCode.email === email;
};

export const generatePasswordResetToken = async (
  DB: D1Database,
  { userId }: { userId: string }
) => {
  const db = initializeDB(DB);
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));
  const token = generateIdFromEntropySize(25);
  const hashedToken = hashSHA256(token);
  await db.insert(passwordResetTokens).values({
    hashedToken,
    userId,
    expiresAt: createDate(new TimeSpan(2, 'h')),
  });
  return token;
};

export const hashSHA256 = (value: string | Uint8Array) => {
  return bytesToHex(sha256(value));
};

export const hashArgon2id = (
  value: string | Uint8Array,
  salt: string | Uint8Array,
  options?: ArgonOpts
) => {
  const { t = 2, m = 19456, p = 1, dkLen = 32 } = options ?? {};
  return bytesToHex(argon2id(value, salt, { t, m, p, dkLen }));
};
