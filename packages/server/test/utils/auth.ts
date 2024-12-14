import app from '../../src';
import { eq } from 'drizzle-orm';
import { env } from 'cloudflare:test';
import { executionCtx } from '../mocks';
import { createDate, TimeSpan } from 'oslo';
import { sha256, generateId } from '@cs/utils';
import { initializeDB } from '../../src/services/db';
import { passwordResetTokens } from '../../src/services/db/schema';

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
    executionCtx,
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
    executionCtx,
  );
};

export const signOut = async (headers = {}) => {
  return app.request(
    '/api/auth/sign-out',
    {
      method: 'POST',
      headers,
    },
    env,
    executionCtx,
  );
};

export const getUser = async (headers = {}) => {
  return app.request(
    '/api/user/profile',
    {
      headers,
    },
    env,
    executionCtx,
  );
};

export const makeAuthor = async (
  headers = {},
  bearer = env.AUTH_AUTHOR_TOKEN,
) => {
  return app.request(
    '/api/user/author',
    {
      method: 'POST',
      headers: {
        ...headers,
        Authorization: `Bearer ${bearer}`,
      },
    },
    env,
    executionCtx,
  );
};

export const verifyEmail = async (userId: string, headers = {}) => {
  const code = await getVerificationCode(userId);

  return app.request(
    `/api/auth/verify-email/${code}`,
    {
      method: 'POST',
      headers,
    },
    env,
    executionCtx,
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
