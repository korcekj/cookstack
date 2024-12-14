import app from '../../src';
import { env } from 'cloudflare:test';
import { executionCtx } from '../mocks';

export const createRecipe = async (
  categoryId: string,
  headers = {},
  name = 'Test 1',
) => {
  return app.request(
    '/api/recipes',
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cook: 1,
        yield: 1,
        preparation: 1,
        categoryId,
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

export const deleteRecipe = async (recipeId: string, headers = {}) => {
  return app.request(
    `/api/recipes/${recipeId}`,
    {
      method: 'DELETE',
      headers,
    },
    env,
    executionCtx,
  );
};
