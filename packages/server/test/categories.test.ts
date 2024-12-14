import type { User, Category } from '@cs/utils/zod';

import app from '../src';
import { env } from 'cloudflare:test';
import { executionCtx } from './mocks';
import { createRecipe, deleteRecipe } from './utils/recipe';
import { getUser, makeAuthor, verifyEmail } from './utils/auth';
import { createCategory, deleteCategory } from './utils/category';

let recipeId: string | null = null;
let categoryId: string | null = null;

describe('Categories route - /api/categories', () => {
  beforeEach(async ({ headers }) => {
    let cookie = headers['Cookie'];
    const user = await (await getUser(headers)).json<User>();

    if (!user.emailVerified) {
      const res = await verifyEmail(user.id, headers);
      cookie = res.headers.get('set-cookie') ?? '';
    }

    if (user.role !== 'author') {
      const res = await makeAuthor({ ...headers, Cookie: cookie });
      cookie = res.headers.get('set-cookie') ?? '';
    }

    headers['Cookie'] = cookie;
  });

  it('Should not return any category - POST /api/categories', async () => {
    const res = await app.request('/api/categories', {}, env, executionCtx);

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      categories: [],
      total: 0,
    });
  });

  it('Should create a category - POST /api/categories', async ({ headers }) => {
    const res = await createCategory(headers);

    const json = await res.json<{ id: string }>();

    expect(res.status).toBe(201);
    expect(json).toMatchObject({
      id: expect.any(String),
    });

    categoryId = json.id;
  });

  it('Should not create a category due to its existence - POST /api/categories', async ({
    headers,
  }) => {
    const res = await createCategory(headers);

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: 'Category already exists',
    });
  });

  it('Should return categories - POST /api/categories', async () => {
    const res = await app.request('/api/categories', {}, env, executionCtx);

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      categories: [{ id: categoryId }],
      total: 1,
    });
  });

  it('Should not return any categories due to offset - POST /api/categories', async () => {
    const res = await app.request(
      '/api/categories?limit=1&offset=1',
      {},
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      categories: [],
      total: 1,
      page: 2,
    });
  });

  it('Should not get a category - GET /api/categories/:categoryId', async () => {
    const res = await app.request(
      '/api/categories/0000000000000000',
      {},
      env,
      executionCtx,
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      error: 'Category not found',
    });
  });
  it('Should get a category - GET /api/categories/:categoryId', async () => {
    const res = await app.request(
      `/api/categories/${categoryId}`,
      {},
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json<Category>()).toMatchObject({
      id: categoryId,
      name: expect.any(String),
      slug: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('Should not return any recipes - GET /api/categories/:categoryId/recipes', async () => {
    const res = await app.request(
      `/api/categories/${categoryId}/recipes`,
      {},
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      recipes: [],
      total: 0,
    });
  });

  it('Should return recipes - GET /api/categories/:categoryId/recipes', async ({
    headers,
  }) => {
    let res = await createRecipe(categoryId!, headers);
    recipeId = (await res.json<{ id: string }>()).id;

    res = await app.request(
      `/api/categories/${categoryId}/recipes`,
      {},
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      recipes: [{ id: recipeId }],
      total: 1,
    });
  });

  it('Should not update a category - PATCH /api/categories/:categoryId', async ({
    headers,
  }) => {
    const res = await app.request(
      `/api/categories/0000000000000000`,
      {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          translations: [
            {
              name: 'Test 2',
              language: 'en',
            },
          ],
        }),
      },
      env,
      executionCtx,
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      error: 'Category not found',
    });
  });

  it('Should not update a category due to its existence - PATCH /api/categories/:categoryId', async ({
    headers,
  }) => {
    await createCategory(headers, 'Test 2');

    const res = await app.request(
      `/api/categories/${categoryId}`,
      {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          translations: [
            {
              name: 'Test 2',
              language: 'en',
            },
          ],
        }),
      },
      env,
      executionCtx,
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: 'Category already exists',
    });
  });

  it('Should update a category - PATCH /api/categories/:categoryId', async ({
    headers,
  }) => {
    const res = await app.request(
      `/api/categories/${categoryId}`,
      {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          translations: [
            {
              name: 'Test 3',
              language: 'en',
            },
          ],
        }),
      },
      env,
      executionCtx,
    );

    expect(res.status).toBe(204);
  });

  it('Should not delete a category - DELETE /api/categories/:categoryId', async ({
    headers,
  }) => {
    const res = await deleteCategory('0000000000000000', headers);

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      error: 'Category not found',
    });
  });

  it('Should not delete a category due to linked recipes - DELETE /api/categories/:categoryId', async ({
    headers,
  }) => {
    const res = await deleteCategory(categoryId!, headers);

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: 'Category contains recipes',
    });
  });

  it('Should delete a category - DELETE /api/categories/:categoryId', async ({
    headers,
  }) => {
    await deleteRecipe(recipeId!, headers);

    const res = await deleteCategory(categoryId!, headers);

    expect(res.status).toBe(204);

    recipeId = null;
    categoryId = null;
  });
});
