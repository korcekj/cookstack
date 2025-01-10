import { defaultHeaders } from './utils';
import { signUp, signIn, signOut } from './utils/auth';
import { applyD1Migrations, env } from 'cloudflare:test';
import { afterEach, beforeEach, beforeAll } from 'vitest';

declare module 'vitest' {
  export interface TestContext {
    headers: Record<string, string>;
  }
}

const headers: Record<string, string> = { ...defaultHeaders };

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.MIGRATIONS);

  const res = await signUp('test1@example.com', 'password123', headers);

  headers['Cookie'] = res.headers.get('set-cookie') ?? '';

  await signOut(headers);

  delete headers['Cookie'];
});

beforeEach(async context => {
  const res = await signIn('test1@example.com', 'password123', headers);

  headers['Cookie'] = res.headers.get('set-cookie') ?? '';

  context.headers = headers;
});

afterEach(async () => {
  await signOut(headers);

  delete headers['Cookie'];
});
