import type { Role } from '@cs/utils/zod';

import app from '../../src';
import { env } from 'cloudflare:test';
import { executionCtx } from '../mocks';

export const getUser = async (headers = {}) => {
  return app.request(
    '/api/user/profile',
    {
      headers,
    },
    env,
    executionCtx,
  );
};

export const createRoleRequest = async (role: Role, headers = {}) => {
  return app.request(
    '/api/user/role-requests',
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role,
      }),
    },
    env,
    executionCtx,
  );
};
