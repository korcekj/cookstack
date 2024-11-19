import app from '../src/index';
import { eq } from 'drizzle-orm';
import { sha256 } from '../src/utils';
import { env } from 'cloudflare:test';
import { generateId } from '@cs/utils';
import { createDate, TimeSpan } from 'oslo';
import { initializeDB } from '../src/services/db';
import { passwordResetTokens } from '../src/services/db/schema';

export const signUp = async (email: string, password: string, headers = {}) => {
  return app.request(
    '/api/auth/sign-up',
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        passwordConfirm: password,
      }),
    },
    env,
  );
};

export const signIn = async (email: string, password: string, headers = {}) => {
  return app.request(
    '/api/auth/sign-in',
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    },
    env,
  );
};

export const signOut = async (headers = {}) => {
  return app.request(
    '/api/auth/sign-out',
    {
      method: 'POST',
      headers: {
        ...headers,
      },
    },
    env,
  );
};

export const getVerificationCode = async (userId: string) => {
  const db = initializeDB(env.DB);
  const { code } =
    (await db.query.emailVerificationCodes.findFirst({
      where: (t, { eq }) => eq(t.userId, userId),
    })) ?? {};

  return code;
};

export const getResetPasswordToken = async (userId: string) => {
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
