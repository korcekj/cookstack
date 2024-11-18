import app from '../src/index';
import { eq } from 'drizzle-orm';
import { sha256 } from '../src/utils';
import { env } from 'cloudflare:test';
import { generateId } from '@cs/utils';
import { createDate, TimeSpan } from 'oslo';
import { initializeDB } from '../src/services/db';
import { passwordResetTokens } from '../src/services/db/schema';

let userId: string | null = null;
let cookie: string | null = null;

describe('Auth module', () => {
  it('Should register a user - POST /api/auth/sign-up', async ({ headers }) => {
    const res = await app.request(
      '/api/auth/sign-up',
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          passwordConfirm: 'password123',
        }),
      },
      env,
    );

    const json = await res.json<{ user: { id: string } }>();
    expect(res.status).toBe(201);
    expect(json).toMatchObject({
      user: {
        emailVerified: false,
        email: 'john.doe@example.com',
      },
    });

    userId = json.user.id;
  });

  it('Should not register a user - POST /api/auth/sign-up', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/auth/sign-up',
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'john.doe@example.com',
          password: 'password123',
          passwordConfirm: 'password123',
        }),
      },
      env,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: {
        email: 'Email cannot be used',
      },
    });
  });

  it('Should not login a user - POST /api/auth/sign-in', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/auth/sign-in',
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'john.doe@example.com',
          password: 'password',
        }),
      },
      env,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: 'Invalid email or password',
    });
  });

  it('Should login a user - POST /api/auth/sign-in', async ({ headers }) => {
    const res = await app.request(
      '/api/auth/sign-in',
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'john.doe@example.com',
          password: 'password123',
        }),
      },
      env,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      user: {
        email: 'john.doe@example.com',
      },
    });

    cookie = res.headers.get('set-cookie');
  });

  it('Should resend a verification code - POST /api/auth/verify-email', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/auth/verify-email',
      {
        method: 'POST',
        headers: {
          ...headers,
          Cookie: cookie ?? '',
        },
      },
      env,
    );

    expect(res.status).toBe(204);
  });

  it('Should not verify a user - POST /api/auth/verify-email/:code', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/auth/verify-email/123456',
      {
        method: 'POST',
        headers: {
          ...headers,
          Cookie: cookie ?? '',
        },
      },
      env,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: 'Invalid code',
    });
  });

  it('Should not generate a reset token - POST /api/auth/reset-password', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/auth/reset-password',
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'john.doe@example.com',
        }),
      },
      env,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: 'Invalid email',
    });
  });

  it('Should verify a user - POST /api/auth/verify-email/:code', async ({
    headers,
  }) => {
    const db = initializeDB(env.DB);
    const record = await db.query.emailVerificationCodes.findFirst({
      where: (t, { eq }) => eq(t.userId, userId!),
    });

    const res = await app.request(
      `/api/auth/verify-email/${record?.code}`,
      {
        method: 'POST',
        headers: {
          ...headers,
          Cookie: cookie ?? '',
        },
      },
      env,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      user: {
        emailVerified: true,
        email: 'john.doe@example.com',
      },
    });

    cookie = res.headers.get('set-cookie');
  });

  it('Should generate a reset token - POST /api/auth/reset-password', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/auth/reset-password',
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'john.doe@example.com',
        }),
      },
      env,
    );

    expect(res.status).toBe(204);
  });

  it('Should not reset a password - POST /api/auth/reset-password/:token', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/auth/reset-password/0000000000000000000000000000000000000000',
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'password123',
          passwordConfirm: 'password123',
        }),
      },
      env,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: 'Invalid token',
    });
  });

  it('Should reset a password - POST /api/auth/reset-password/:token', async ({
    headers,
  }) => {
    const db = initializeDB(env.DB);
    const token = generateId(40);
    const hashedToken = sha256(token);
    await db.batch([
      db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, userId!)),
      db.insert(passwordResetTokens).values({
        hashedToken,
        userId: userId!,
        expiresAt: createDate(new TimeSpan(2, 'h')),
      }),
    ]);

    const res = await app.request(
      `/api/auth/reset-password/${token}`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'password123',
          passwordConfirm: 'password123',
        }),
      },
      env,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      user: {
        email: 'john.doe@example.com',
      },
    });

    cookie = res.headers.get('set-cookie');
  });

  it('Should logout a user - POST /api/auth/sign-out', async ({ headers }) => {
    const res = await app.request(
      '/api/auth/sign-out',
      {
        method: 'POST',
        headers: {
          ...headers,
          Cookie: cookie ?? '',
        },
      },
      env,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      user: null,
    });

    userId = null;
    cookie = null;
  });
});
