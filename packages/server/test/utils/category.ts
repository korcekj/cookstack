import app from '../../src';
import { env } from 'cloudflare:test';
import { executionCtx } from '../mocks';

export const createCategory = async (headers = {}, name = 'Test 1') => {
  return app.request(
    '/api/categories',
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        translations: [
          {
            name,
            language: 'en',
          },
        ],
      }),
    },
    env,
    executionCtx,
  );
};

export const deleteCategory = async (categoryId: string, headers = {}) => {
  return app.request(
    `/api/categories/${categoryId}`,
    {
      method: 'DELETE',
      headers,
    },
    env,
    executionCtx,
  );
};
