import {
  signUp,
  signIn,
  signOut,
  verifyEmail,
  getResetPasswordToken,
} from './helpers';
import app from '../src/index';
import { env } from 'cloudflare:test';
import { executionCtx, emailSend } from './mocks';

let userId: string | null = null;
let cookie: string | null = null;

describe('Auth module', () => {
  it('Should register a user - POST /api/auth/sign-up', async ({ headers }) => {
    const res = await signUp('john.doe@example.com', 'password123', headers);

    const json = await res.json<{ id: string }>();

    expect(res.status).toBe(201);
    expect(json).toMatchObject({
      emailVerified: false,
      email: 'john.doe@example.com',
    });
    expect(emailSend).toHaveBeenCalledWith({
      to: 'john.doe@example.com',
      subject: 'Verification code',
      html: expect.any(String),
    });

    userId = json.id;
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
      email: 'john.doe@example.com',
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
      executionCtx,
    );

    expect(res.status).toBe(204);
    expect(emailSend).toHaveBeenCalledWith({
      to: 'john.doe@example.com',
      subject: 'Verification code',
      html: expect.any(String),
    });
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
      executionCtx,
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
      executionCtx,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: 'Invalid email',
    });
  });

  it('Should verify a user - POST /api/auth/verify-email/:code', async ({
    headers,
  }) => {
    const res = await verifyEmail(userId!, { ...headers, Cookie: cookie });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      emailVerified: true,
      email: 'john.doe@example.com',
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
      executionCtx,
    );

    expect(res.status).toBe(204);
    expect(emailSend).toHaveBeenCalledWith({
      to: 'john.doe@example.com',
      subject: 'Password reset',
      html: expect.any(String),
    });
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
      executionCtx,
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
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      email: 'john.doe@example.com',
    });

    cookie = res.headers.get('set-cookie');
  });

  it('Should logout a user - POST /api/auth/sign-out', async ({ headers }) => {
    const res = await signOut({ ...headers, Cookie: cookie });

    expect(res.status).toBe(204);

    userId = null;
    cookie = null;
  });
});
