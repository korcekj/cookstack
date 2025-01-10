import type { User, RoleRequest } from '@cs/utils/zod';

import app from '../src';
import { env } from 'cloudflare:test';
import { generateImage } from './utils/image';
import { setRole, deleteRoleRequests } from './utils/db';
import { executionCtx, imageUpload, emailSend } from './mocks';
import { signIn, signUp, getUser, createRoleRequest } from './utils/auth';

describe('User route - /api/user', () => {
  const roleRequests: string[] = [];

  beforeAll(async () => {
    let res = await signIn('test2@example.com', 'password123');
    if (!res.ok) res = await signUp('test2@example.com', 'password123');

    const json = await res.json<User>();
    await setRole(json.id, 'admin');

    await deleteRoleRequests();
  });

  it('Should not return a user due to invalid cookie header - POST /api/user/profile', async () => {
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
      email: 'test1@example.com',
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

  it('Should not update user image due to invalid file type - PUT /api/user/profile/image', async ({
    headers,
  }) => {
    const formData = new FormData();
    const blob = new Blob(['test'], { type: 'text/plain' });
    formData.append('image', blob, 'test.txt');

    const res = await app.request(
      '/api/user/profile/image',
      {
        method: 'PUT',
        headers,
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
    const blob = generateImage();
    const formData = new FormData();
    formData.append('image', blob, 'test.jpg');

    const res = await app.request(
      '/api/user/profile/image',
      {
        method: 'PUT',
        headers,
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

  it('Should not return any role requests - GET /api/user/role-requests', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/user/role-requests',
      { headers },
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      requests: [],
      total: 0,
    });
  });

  it('Should not create a user role request due to assigned role - POST /api/user/role-requests', async ({
    headers,
  }) => {
    const res = await createRoleRequest('user', headers);

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: 'Bad request',
    });
  });

  it('Should create an author role request - POST /api/user/role-requests', async ({
    headers,
  }) => {
    const res = await createRoleRequest('author', headers);

    const json = await res.json<RoleRequest>();

    expect(res.status).toBe(201);
    expect(json).toMatchObject({
      id: expect.any(String),
      role: 'author',
      status: 'pending',
    });

    roleRequests.push(json.id);
  });

  it('Should create an admin role request - POST /api/user/role-requests', async ({
    headers,
  }) => {
    const res = await createRoleRequest('admin', headers);

    const json = await res.json<RoleRequest>();

    expect(res.status).toBe(201);
    expect(json).toMatchObject({
      id: expect.any(String),
      role: 'admin',
      status: 'pending',
    });

    roleRequests.push(json.id);
  });

  it('Should not create an author role request due to existing one - POST /api/user/role-requests', async ({
    headers,
  }) => {
    const res = await createRoleRequest('author', headers);

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: 'Role already requested',
    });
  });

  it('Should return role requests - GET /api/user/role-requests', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/user/role-requests?orderBy=-role',
      { headers },
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(emailSend).toHaveBeenCalledWith({
      to: 'test2@example.com',
      subject: 'Role request',
      html: expect.any(String),
    });
    expect(await res.json()).toMatchObject({
      requests: roleRequests.map(id => ({ id })),
      total: 2,
    });
  });
});
