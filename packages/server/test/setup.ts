import app from '../src/index';
import { applyD1Migrations, env } from 'cloudflare:test';
import { afterEach, beforeEach, beforeAll } from 'vitest';

declare module 'vitest' {
  export interface TestContext {
    headers: Record<string, string>;
  }
}

const headers: Record<string, string> = {
  Origin: '',
  'Accept-Language': 'en',
};

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.MIGRATIONS);

  const res = await app.request(
    '/api/auth/sign-up',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
      }),
    },
    env,
  );

  headers['Cookie'] = res.headers.get('set-cookie') ?? '';

  await app.request(
    '/api/auth/sign-out',
    {
      method: 'POST',
      headers: {
        ...headers,
      },
    },
    env,
  );

  delete headers['Cookie'];
});

beforeEach(async context => {
  const res = await app.request(
    '/api/auth/sign-in',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    },
    env,
  );

  headers['Cookie'] = res.headers.get('set-cookie') ?? '';

  context.headers = headers;
});

afterEach(async () => {
  await app.request(
    '/api/auth/sign-out',
    {
      method: 'POST',
      headers: {
        ...headers,
      },
    },
    env,
  );

  delete headers['Cookie'];
});
