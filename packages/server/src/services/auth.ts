import type { Context } from 'hono';
import type { Env } from '../types';
import type { User } from '../db/schema';

import { Google } from 'arctic';
import { omit } from '@cs/utils';
import { eq } from 'drizzle-orm';
import { sha256 } from '../utils';
import { initializeDB } from '../db';
import { pbkdf2 as pbkdf2_, randomBytes } from 'crypto';
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
    DatabaseUserAttributes: User;
  }
}

export const initializeLucia = (c: Context<Env>) => {
  const adapter = new DrizzleSQLiteAdapter(
    initializeDB(c.env.DB),
    sessions,
    users
  );
  return new Lucia(adapter, {
    getUserAttributes: (attributes) => omit(attributes, ['hashedPassword']),
    sessionExpiresIn: new TimeSpan(30, 'd'),
    sessionCookie: {
      name: c.env.COOKIE_NAME,
      attributes: {
        domain: c.env.COOKIE_DOMAIN,
        secure: c.env.ENV === 'production',
        sameSite: c.env.ENV === 'production' ? 'none' : undefined,
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
  const code = generateRandomString(6, alphabet('0-9'));
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
  const hashedToken = sha256(token);
  await db.insert(passwordResetTokens).values({
    hashedToken,
    userId,
    expiresAt: createDate(new TimeSpan(2, 'h')),
  });
  return token;
};

export const pbkdf2 = {
  key: (
    value: string | Uint8Array,
    salt: string | Uint8Array,
    options?: { c: number; dkLen: number; digest: 'sha256' | 'sha512' }
  ) => {
    const { c = 100_000, dkLen = 64, digest = 'sha512' } = options ?? {};
    return new Promise<string>((resolve, reject) => {
      pbkdf2_(value, salt, c, dkLen, digest, (err, key) => {
        if (err) reject(err);
        else resolve(key.toString('hex'));
      });
    });
  },
  hash: async (value: string | Uint8Array) => {
    const salt = randomBytes(16).toString('hex');
    const key = await pbkdf2.key(value, salt);
    return `${salt}:${key}`;
  },
  verify: async (hash: string, value: string | Uint8Array) => {
    const [salt, key] = hash.split(':');
    const targetKey = await pbkdf2.key(value, salt);
    return targetKey === key;
  },
};
