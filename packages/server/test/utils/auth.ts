import type { Role } from '@cs/utils/zod';

import app from '../../src';
import { env } from 'cloudflare:test';
import { executionCtx } from '../mocks';
import { getVerificationCode } from './db';

export const signUp = async (email: string, password: string, headers = {}) => {
  return app.request(
    '/api/auth/sign-up',
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        passwordConfirm: password,
        firstName: null,
        lastName: null,
      }),
    },
    env,
    executionCtx,
  );
};

export const signIn = async (email: string, password: string, headers = {}) => {
  return app.request(
    '/api/auth/sign-in',
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    },
    env,
    executionCtx,
  );
};

export const signOut = async (headers = {}) => {
  return app.request(
    '/api/auth/sign-out',
    {
      method: 'POST',
      headers,
    },
    env,
    executionCtx,
  );
};

export const verifyEmail = async (headers = {}) => {
  const res = await getUser(headers);
  const { id: userId } = await res.json<{ id: string }>();

  const code = await getVerificationCode(userId);

  return app.request(
    `/api/auth/verify-email/${code}`,
    {
      method: 'POST',
      headers,
    },
    env,
    executionCtx,
  );
};

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
