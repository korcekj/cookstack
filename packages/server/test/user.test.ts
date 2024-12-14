import type { User } from '@cs/utils/zod';

import app from '../src';
import { env } from 'cloudflare:test';
import { executionCtx, imageUpload } from './mocks';
import { getUser, makeAuthor, verifyEmail, generateImage } from './helpers';

let userId: string | null = null;

describe('User route - /api/user', () => {
  it('Should not return a user - POST /api/user/profile', async () => {
    const res = await getUser();

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({
      error: 'Unauthorized',
    });
  });

  it('Should return a user - POST /api/user/profile', async ({ headers }) => {
    const res = await getUser(headers);

    const json = await res.json<User>();
    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      email: 'test@example.com',
    });

    userId = json.id;
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
      executionCtx,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: 'Invalid token',
    });
  });

  it('Should not make an author due to unverified email - POST /api/user/author', async ({
    headers,
  }) => {
    const res = await makeAuthor(headers);

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: 'Unverified email',
    });
  });

  it('Should make an author - POST /api/user/author', async ({ headers }) => {
    let res = await verifyEmail(userId!, headers);
    const cookie = res.headers.get('set-cookie') ?? '';

    res = await makeAuthor({ ...headers, Cookie: cookie });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      role: 'author',
      emailVerified: true,
    });
  });

  it('Should not make an author due to its existence - POST /api/user/author', async ({
    headers,
  }) => {
    const res = await makeAuthor({ ...headers });

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
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      firstName: 'John',
      lastName: 'Doe',
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
      executionCtx,
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
      executionCtx,
    );

    const json = await res.json<{ id: string }>();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      id: expect.any(String),
      url: expect.any(String),
    });
    expect(imageUpload).toHaveBeenCalledWith(expect.any(File), {
      publicId: json.id,
      folder: `cookstack/${env.ENV}/users`,
      uploadPreset: 'cookstack',
    });
  });
});
