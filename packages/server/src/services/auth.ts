import type { Context } from 'hono';
import type { Env } from '../types';
import type { User } from '../db/schema';
import type { ScryptOpts } from '@noble/hashes/scrypt';

import { omit } from 'lodash';
import { Google } from 'arctic';
import { eq } from 'drizzle-orm';
import { initializeDB } from '../db';
import { sha256 as sha256_ } from '@noble/hashes/sha256';
import { scrypt as scrypt_ } from '@noble/hashes/scrypt';
import { Lucia, generateIdFromEntropySize } from 'lucia';
import { generateRandomString, alphabet } from 'oslo/crypto';
import { bytesToHex, randomBytes } from '@noble/hashes/utils';
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
    getUserAttributes: (attributes) => omit(attributes, 'hashedPassword'),
    sessionExpiresIn: new TimeSpan(30, 'd'),
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
  const hashedToken = sha256(token);
  await db.insert(passwordResetTokens).values({
    hashedToken,
    userId,
    expiresAt: createDate(new TimeSpan(2, 'h')),
  });
  return token;
};

export const sha256 = (value: string | Uint8Array) => {
  return bytesToHex(sha256_(value));
};

export const scrypt = {
  key: (
    value: string | Uint8Array,
    salt: string | Uint8Array,
    options?: ScryptOpts
  ) => {
    const { N = 16384, r = 16, p = 1, dkLen = 64 } = options ?? {};
    return bytesToHex(scrypt_(value, salt, { N, r, p, dkLen }));
  },
  hash: (value: string | Uint8Array) => {
    const salt = bytesToHex(randomBytes(32));
    const key = scrypt.key(value, salt);
    return `${salt}:${key}`;
  },
  verify: (hash: string, value: string | Uint8Array) => {
    const [salt, key] = hash.split(':');
    const targetKey = scrypt.key(value, salt);
    return targetKey === key;
  },
};
