import app from '../src';
import { eq } from 'drizzle-orm';
import { env } from 'cloudflare:test';
import { executionCtx } from './mocks';
import { createDate, TimeSpan } from 'oslo';
import { sha256, generateId } from '@cs/utils';
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

export const makeAuthor = async (headers = {}) => {
  return app.request(
    '/api/user/author',
    {
      method: 'POST',
      headers: {
        ...headers,
        Authorization: `Bearer ${env.AUTH_AUTHOR_TOKEN}`,
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

export const createCategory = async (headers = {}, name = 'Test 1') => {
  return app.request(
    '/api/categories',
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        translations: [
          {
            name,
            language: 'en',
          },
        ],
      }),
    },
    env,
    executionCtx,
  );
};

export const createRecipe = async (
  headers = {},
  categoryId: string,
  name = 'Test 1',
) => {
  return app.request(
    '/api/recipes',
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cook: 1,
        yield: 1,
        preparation: 1,
        categoryId,
        translations: [
          {
            name,
            language: 'en',
          },
        ],
      }),
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

export const generateImage = () => {
  const base64Image =
    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
  const binary = atob(base64Image);
  const bytes = new Uint8Array(binary.length).map((_, i) =>
    binary.charCodeAt(i),
  );
  return new Blob([bytes], { type: 'image/jpeg' });
};
