import app from '../src/index';
import { applyD1Migrations, env } from 'cloudflare:test';
import { afterEach } from 'vitest';

declare module 'vitest' {
  export interface TestContext {
    headers: Record<string, string>;
  }
}

const headers: Record<string, string> = {};

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

  const setCookie = res.headers.get('set-cookie');
  if (setCookie) headers['Cookie'] = setCookie.split(';')[0];

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

  const setCookie = res.headers.get('set-cookie');
  if (setCookie) headers['Cookie'] = setCookie.split(';')[0];

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
