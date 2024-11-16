import app from '../src/index';
import { env } from 'cloudflare:test';

describe('User module', () => {
  it('Should return a user - POST /api/user/profile', async ({ headers }) => {
    const res = await app.request(
      '/api/user/profile',
      {
        headers: {
          ...headers,
        },
      },
      env,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      user: {
        email: 'test@example.com',
      },
    });
  });
});
