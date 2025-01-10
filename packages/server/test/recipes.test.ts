import type { User, Recipe, Category } from '@cs/utils/zod';

import {
  createRecipe,
  deleteRecipe,
  publishRecipe,
  createCategory,
} from './utils';
import app from '../src';
import { env } from 'cloudflare:test';
import { executionCtx } from './mocks';
import { signUp, signIn } from './utils/auth';
import { setRole, deleteRecipes, deleteCategories } from './utils/db';

describe('Recipes route - /api/recipes', () => {
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

  it('Should not return any recipe - POST /api/recipes', async () => {
    const res = await app.request('/api/recipes', {}, env, executionCtx);

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      recipes: [],
      total: 0,
    });
  });

  it('Should not create a recipe due to invalid category - POST /api/recipes', async ({
    headers,
  }) => {
    const res = await createRecipe(
      '0000000000000000',
      {
        ...headers,
        Cookie: cookie,
      },
      'Test 1',
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: 'Category not found',
    });
  });

  it('Should create a recipe - POST /api/recipes', async ({ headers }) => {
    let res = await createCategory({ ...headers, Cookie: cookie });
    categoryId = (await res.json<Category>()).id;

    res = await createRecipe(
      categoryId,
      { ...headers, Cookie: cookie },
      'Test 2',
    );

    const json = await res.json<Recipe>();

    expect(res.status).toBe(201);
    expect(json).toMatchObject({
      id: expect.any(String),
      name: 'Test 2',
      slug: 'test-2',
      user: expect.any(Object),
      category: {
        id: categoryId,
      },
      preparation: expect.any(Number),
      cook: expect.any(Number),
      yield: expect.any(Number),
      status: 'draft',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    recipeId = json.id;
  });

  it('Should return recipes - POST /api/recipes', async ({ headers }) => {
    const res = await app.request(
      '/api/recipes',
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

  it('Should not get a recipe due to invalid id - GET /api/recipes/:recipeId', async () => {
    const res = await app.request(
      '/api/recipes/0000000000000000',
      {},
      env,
      executionCtx,
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      error: 'Recipe not found',
    });
  });

  it('Should not get a recipe due to draft - GET /api/recipes/:recipeId', async ({
    headers,
  }) => {
    const res = await app.request(
      `/api/recipes/${recipeId}`,
      { headers },
      env,
      executionCtx,
    );

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({
      error: 'Forbidden',
    });
  });

  it('Should get a recipe - GET /api/recipes/:recipeId', async ({
    headers,
  }) => {
    const res = await app.request(
      `/api/recipes/${recipeId}`,
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
      id: recipeId,
      name: expect.any(String),
      slug: expect.any(String),
      user: expect.any(Object),
      category: {
        id: categoryId,
      },
      preparation: expect.any(Number),
      cook: expect.any(Number),
      yield: expect.any(Number),
      status: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('Should not update a recipe due to invalid id - PATCH /api/recipes/:recipeId', async ({
    headers,
  }) => {
    const res = await app.request(
      `/api/recipes/0000000000000000`,
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

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      error: 'Recipe not found',
    });
  });

  it('Should not update a recipe due to invalid category - PATCH /api/recipes/:recipeId', async ({
    headers,
  }) => {
    const res = await app.request(
      `/api/recipes/${recipeId}`,
      {
        method: 'PATCH',
        headers: {
          ...headers,
          Cookie: cookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId: '0000000000000000',
        }),
      },
      env,
      executionCtx,
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: 'Category not found',
    });
  });

  it('Should update a recipe - PATCH /api/recipes/:recipeId', async ({
    headers,
  }) => {
    const res = await app.request(
      `/api/recipes/${recipeId}`,
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
              name: 'Test 4',
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
      id: recipeId,
      name: 'Test 4',
      slug: 'test-4',
      user: expect.any(Object),
      category: {
        id: categoryId,
      },
      preparation: expect.any(Number),
      cook: expect.any(Number),
      yield: expect.any(Number),
      status: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('Should publish a recipe - PATCH /api/recipes/:recipeId/publish', async ({
    headers,
  }) => {
    const res = await publishRecipe(recipeId, { ...headers, Cookie: cookie });
    expect(res.status).toBe(204);
  });

  it('Should not delete a recipe due to invalid id - DELETE /api/recipes/:recipeId', async ({
    headers,
  }) => {
    const res = await deleteRecipe('0000000000000000', {
      ...headers,
      Cookie: cookie,
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      error: 'Recipe not found',
    });
  });

  it('Should delete a recipe - DELETE /api/recipes/:recipeId', async ({
    headers,
  }) => {
    const res = await deleteRecipe(recipeId, { ...headers, Cookie: cookie });

    expect(res.status).toBe(204);
  });
});
