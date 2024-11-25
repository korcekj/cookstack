import app from '../src/index';
import { env } from 'cloudflare:test';
import { verifyEmail, generateImage } from './helpers';

let userId: string | null = null;

describe('User module', () => {
  it('Should not return a user - POST /api/user/profile', async () => {
    const res = await app.request('/api/user/profile', {}, env);

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({
      error: 'Unauthorized',
    });
  });

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

    const json = await res.json<{ user: { id: string } }>();
    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      user: {
        email: 'test@example.com',
      },
    });

    userId = json.user.id;
  });

  it('Should not make an author due to invalid token - POST /api/user/author', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/user/author',
      {
        method: 'POST',
        headers: {
          ...headers,
          Authorization: 'Bearer test',
        },
      },
      env,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: 'Invalid token',
    });
  });

  it('Should not make an author due to unverified email - POST /api/user/author', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/user/author',
      {
        method: 'POST',
        headers: {
          ...headers,
          Authorization: `Bearer ${env.AUTH_AUTHOR_TOKEN}`,
        },
      },
      env,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: 'Unverified email',
    });
  });

  it('Should make an author - POST /api/user/author', async ({ headers }) => {
    let res = await verifyEmail(userId!, headers);
    const cookie = res.headers.get('set-cookie') ?? '';

    res = await app.request(
      '/api/user/author',
      {
        method: 'POST',
        headers: {
          ...headers,
          Cookie: cookie,
          Authorization: `Bearer ${env.AUTH_AUTHOR_TOKEN}`,
        },
      },
      env,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      user: {
        role: 'author',
        emailVerified: true,
      },
    });
  });

  it('Should not make an author due to its existence - POST /api/user/author', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/user/author',
      {
        method: 'POST',
        headers: {
          ...headers,
          Authorization: `Bearer ${env.AUTH_AUTHOR_TOKEN}`,
        },
      },
      env,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: 'Author already exists',
    });
  });

  it('Should update user profile - PATCH /api/user/profile', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/user/profile',
      {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
        }),
      },
      env,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      user: {
        firstName: 'John',
        lastName: 'Doe',
      },
    });
  });

  it('Should not update user image - PUT /api/user/profile/image', async ({
    headers,
  }) => {
    const formData = new FormData();
    const blob = new Blob(['test'], { type: 'text/plain' });
    formData.append('image', blob, 'test.txt');

    const res = await app.request(
      '/api/user/profile/image',
      {
        method: 'PUT',
        headers: {
          ...headers,
        },
        body: formData,
      },
      env,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: {
        image: 'File type is not allowed',
      },
    });
  });

  it('Should update user image - PUT /api/user/profile/image', async ({
    headers,
  }) => {
    const formData = new FormData();
    const blob = generateImage();
    formData.append('image', blob, 'test.jpg');

    const res = await app.request(
      '/api/user/profile/image',
      {
        method: 'PUT',
        headers: {
          ...headers,
        },
        body: formData,
      },
      env,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      image: {
        id: expect.any(String),
        url: expect.any(String),
      },
    });
  });
});
