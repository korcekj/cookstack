import type { User, RoleRequest } from '@cs/utils/zod';

import app from '../src';
import { env } from 'cloudflare:test';
import { signUp, signIn } from './utils/auth';
import { executionCtx, emailSend } from './mocks';
import { getUser, createRoleRequest } from './utils/user';
import { setRole, deleteRoleRequests, setRoleRequest } from './utils/db';

describe('Admin route - /api/admin', () => {
  let cookie: string;
  let requestId: string;

  beforeAll(async () => {
    let res = await signIn('test2@example.com', 'password123');
    if (!res.ok) res = await signUp('test2@example.com', 'password123');

    cookie = res.headers.get('set-cookie') ?? '';
    const json = await res.json<User>();
    await setRole(json.id, 'admin');

    await deleteRoleRequests();
  });

  it('Should not return any role requests due to invalid role - GET /api/admin/role-requests', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/admin/role-requests',
      { headers },
      env,
      executionCtx,
    );

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({
      error: 'Forbidden',
    });
  });

  it('Should not return any role requests - GET /api/admin/role-requests', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/admin/role-requests',
      {
        headers: {
          ...headers,
          Cookie: cookie,
        },
      },
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      requests: [],
      total: 0,
    });
  });

  it('Should return role requests - GET /api/admin/role-requests', async ({
    headers,
  }) => {
    let res = await createRoleRequest('author', headers);
    requestId = (await res.json<RoleRequest>()).id;

    res = await app.request(
      '/api/admin/role-requests',
      {
        headers: {
          ...headers,
          Cookie: cookie,
        },
      },
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      requests: [{ id: requestId }],
      total: 1,
    });
  });

  it('Should not update a role request due to invalid request id - POST /api/admin/role-requests/:requestId/:status', async ({
    headers,
  }) => {
    const res = await app.request(
      '/api/admin/role-requests/0000000000000000/approved',
      {
        method: 'POST',
        headers: {
          ...headers,
          Cookie: cookie,
        },
      },
      env,
      executionCtx,
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      error: 'Role request not found',
    });
  });

  it('Should not update a role request due to invalid status - POST /api/admin/role-requests/:requestId/:status', async ({
    headers,
  }) => {
    const res = await app.request(
      `/api/admin/role-requests/${requestId}/invalid`,
      {
        method: 'POST',
        headers: {
          ...headers,
          Cookie: cookie,
        },
      },
      env,
      executionCtx,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: {
        status: "Invalid value. Expected: 'approved' | 'rejected'",
      },
    });
  });

  it('Should reject a role request - POST /api/admin/role-requests/:requestId/:status', async ({
    headers,
  }) => {
    let res = await getUser(headers);
    const userId = (await res.json<User>()).id;

    res = await app.request(
      `/api/admin/role-requests/${requestId}/rejected`,
      {
        method: 'POST',
        headers: {
          ...headers,
          Cookie: cookie,
        },
      },
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      id: requestId,
      role: 'author',
      status: 'rejected',
      user: {
        id: userId,
      },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    await setRoleRequest(requestId, { status: 'pending' });
  });

  it('Should approve a role request - POST /api/admin/role-requests/:requestId/:status', async ({
    headers,
  }) => {
    let res = await getUser(headers);
    const userId = (await res.json<User>()).id;

    res = await app.request(
      `/api/admin/role-requests/${requestId}/approved`,
      {
        method: 'POST',
        headers: {
          ...headers,
          Cookie: cookie,
        },
      },
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      id: requestId,
      role: 'author',
      status: 'approved',
      user: {
        id: userId,
      },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    await setRole(userId, 'user');
    await setRoleRequest(requestId, { status: 'pending' });
  });
});
