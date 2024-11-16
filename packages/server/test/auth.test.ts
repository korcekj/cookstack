import app from '../src/index';
import { env } from 'cloudflare:test';

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
