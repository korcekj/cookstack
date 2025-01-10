import type { User, Category, Recipe } from '@cs/utils/zod';

import app from '../src';
import { env } from 'cloudflare:test';
import { executionCtx } from './mocks';
import { signUp, signIn } from './utils/auth';
import { setRole, deleteRecipes, deleteCategories } from './utils/db';
import { createRecipe, createCategory, deleteCategory } from './utils';

describe('Categories route - /api/categories', () => {
  let cookie: string;
  let recipeId: string;
  let categoryId: string;

  beforeAll(async () => {
    let res = await signIn('test3@example.com', 'password123');
    if (!res.ok) res = await signUp('test3@example.com', 'password123');

    cookie = res.headers.get('set-cookie') ?? '';
    const json = await res.json<User>();
    await setRole(json.id, 'author');

    await deleteRecipes();
    await deleteCategories();
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
    const res = await createCategory({ ...headers, Cookie: cookie }, 'Test 1');

    const json = await res.json<Category>();

    expect(res.status).toBe(201);
    expect(json).toMatchObject({
      id: expect.any(String),
      name: 'Test 1',
      slug: 'test-1',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    categoryId = json.id;
  });

  it('Should not create a category due to its existence - POST /api/categories', async ({
    headers,
  }) => {
    const res = await createCategory({ ...headers, Cookie: cookie }, 'Test 1');

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

  it('Should not get a category due to invalid id - GET /api/categories/:categoryId', async () => {
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
    expect(await res.json()).toMatchObject({
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
    let res = await createRecipe(categoryId, { ...headers, Cookie: cookie });
    recipeId = (await res.json<Recipe>()).id;

    res = await app.request(
      `/api/categories/${categoryId}/recipes`,
      { headers: { ...headers, Cookie: cookie } },
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      recipes: [{ id: recipeId }],
      total: 1,
    });
  });

  it('Should not update a category due to invalid id - PATCH /api/categories/:categoryId', async ({
    headers,
  }) => {
    const res = await app.request(
      `/api/categories/0000000000000000`,
      {
        method: 'PATCH',
        headers: {
          ...headers,
          Cookie: cookie,
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
    await createCategory({ ...headers, Cookie: cookie }, 'Test 2');

    const res = await app.request(
      `/api/categories/${categoryId}`,
      {
        method: 'PATCH',
        headers: {
          ...headers,
          Cookie: cookie,
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
          Cookie: cookie,
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

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      id: categoryId,
      name: 'Test 3',
      slug: 'test-3',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('Should not delete a category due to invalid id - DELETE /api/categories/:categoryId', async ({
    headers,
  }) => {
    const res = await deleteCategory('0000000000000000', {
      ...headers,
      Cookie: cookie,
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      error: 'Category not found',
    });
  });

  it('Should not delete a category due to linked recipes - DELETE /api/categories/:categoryId', async ({
    headers,
  }) => {
    const res = await deleteCategory(categoryId, {
      ...headers,
      Cookie: cookie,
    });

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: 'Category contains recipes',
    });
  });

  it('Should delete a category - DELETE /api/categories/:categoryId', async ({
    headers,
  }) => {
    await deleteRecipes();

    const res = await deleteCategory(categoryId, {
      ...headers,
      Cookie: cookie,
    });

    expect(res.status).toBe(204);
  });
});
