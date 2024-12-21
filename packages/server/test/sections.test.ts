import type { User, Section, Recipe, Category } from '@cs/utils/zod';

import {
  createRecipe,
  createSection,
  createCategory,
  deleteSection,
} from './utils';
import app from '../src';
import { env } from 'cloudflare:test';
import { executionCtx } from './mocks';
import { signUp, signIn } from './utils/auth';
import { setRole, deleteRecipes, deleteCategories } from './utils/db';

describe('Sections route - /api/recipes/:recipeId/sections', () => {
  let cookie: string;
  let recipeId: string;
  let sectionId: string;

  beforeAll(async () => {
    let res = await signIn('test2@example.com', 'password123');
    if (!res.ok) res = await signUp('test2@example.com', 'password123');

    cookie = res.headers.get('set-cookie') ?? '';
    const json = await res.json<User>();
    await setRole(json.id, 'author');

    await deleteRecipes();
    await deleteCategories();

    res = await createCategory({ Cookie: cookie });
    const categoryId = (await res.json<Category>()).id;

    res = await createRecipe(categoryId, { Cookie: cookie });
    recipeId = (await res.json<Recipe>()).id;
  });

  it('Should not return any sections - GET /api/recipes/:recipeId/sections', async () => {
    const res = await app.request(
      `/api/recipes/${recipeId}/sections`,
      {},
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject([]);
  });

  it('Should not create a section due to invalid recipe id - POST /api/recipes/:recipeId/sections', async ({
    headers,
  }) => {
    const res = await createSection('0000000000000000', {
      ...headers,
      Cookie: cookie,
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      error: 'Recipe not found',
    });
  });

  it('Should create a section - POST /api/recipes/:recipeId/sections', async ({
    headers,
  }) => {
    const res = await createSection(recipeId, { ...headers, Cookie: cookie });

    const json = await res.json<Section>();

    expect(res.status).toBe(201);
    expect(json).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      position: expect.any(Number),
    });

    sectionId = json.id;
  });

  it('Should return sections - GET /api/recipes/:recipeId/sections', async () => {
    const res = await app.request(
      `/api/recipes/${recipeId}/sections`,
      {},
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject([{ id: sectionId }]);
  });

  it('Should not update a section due to duplicate position - PUT /api/recipes/:recipeId/sections', async ({
    headers,
  }) => {
    let res = await createSection(
      recipeId,
      { ...headers, Cookie: cookie },
      'Test 2',
    );
    const { id } = await res.json<Section>();

    res = await app.request(
      `/api/recipes/${recipeId}/sections`,
      {
        method: 'PUT',
        headers: {
          ...headers,
          Cookie: cookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            id: sectionId,
            position: 1,
          },
        ]),
      },
      env,
      executionCtx,
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: 'Section already exists',
    });

    await deleteSection(recipeId, id, { ...headers, Cookie: cookie });
  });

  it('Should update a section - PUT /api/recipes/:recipeId/sections', async ({
    headers,
  }) => {
    const res = await app.request(
      `/api/recipes/${recipeId}/sections`,
      {
        method: 'PUT',
        headers: {
          ...headers,
          Cookie: cookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            id: sectionId,
            translations: [
              {
                name: 'Test 3',
                language: 'en',
              },
            ],
          },
        ]),
      },
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject([
      {
        id: sectionId,
        name: 'Test 3',
        position: expect.any(Number),
      },
    ]);
  });

  it('Shold not delete a section due to invalid id - DELETE /api/recipes/:recipeId/sections/:sectionId', async ({
    headers,
  }) => {
    const res = await deleteSection(recipeId, '0000000000000000', {
      ...headers,
      Cookie: cookie,
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      error: 'Section not found',
    });
  });

  it('Should delete a section - DELETE /api/recipes/:recipeId/sections/:sectionId', async ({
    headers,
  }) => {
    const res = await deleteSection(recipeId, sectionId, {
      ...headers,
      Cookie: cookie,
    });

    expect(res.status).toBe(204);
  });
});
