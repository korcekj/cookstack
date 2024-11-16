import app from '../src/index';
import { env } from 'cloudflare:test';

describe('Auth module', () => {
  it('Should register a user - POST /api/auth/sign-up', async () => {
    const res = await app.request(
      '/api/auth/sign-up',
      {
        method: 'POST',
        headers: {
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

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      user: {
        email: 'john.doe@example.com',
      },
    });
  });

  it('Should not register a user - POST /api/auth/sign-up', async () => {
    const res = await app.request(
      '/api/auth/sign-up',
      {
        method: 'POST',
        headers: {
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

  it('Should not login a user - POST /api/auth/sign-in', async () => {
    const res = await app.request(
      '/api/auth/sign-in',
      {
        method: 'POST',
        headers: {
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

  it('Should login a user - POST /api/auth/sign-in', async () => {
    const res = await app.request(
      '/api/auth/sign-in',
      {
        method: 'POST',
        headers: {
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
  });
});
