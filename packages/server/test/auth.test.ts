import {
  signUp,
  signIn,
  signOut,
  getVerificationCode,
  getResetPasswordToken,
} from './helpers';
import app from '../src/index';
import { env } from 'cloudflare:test';

let userId: string | null = null;
let cookie: string | null = null;

describe('Auth module', () => {
  it('Should register a user - POST /api/auth/sign-up', async ({ headers }) => {
    const res = await signUp('john.doe@example.com', 'password123', headers);

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
    const res = await signUp('john.doe@example.com', 'password123', headers);

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
    const res = await signIn('john.doe@example.com', 'password', headers);

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: 'Invalid email or password',
    });
  });

  it('Should login a user - POST /api/auth/sign-in', async ({ headers }) => {
    const res = await signIn('john.doe@example.com', 'password123', headers);

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
    const code = await getVerificationCode(userId!);

    const res = await app.request(
      `/api/auth/verify-email/${code}`,
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
    const token = await getResetPasswordToken(userId!);

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
    const res = await signOut({ ...headers, Cookie: cookie ?? '' });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      user: null,
    });

    userId = null;
    cookie = null;
  });
});
