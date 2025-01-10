import type {
  User,
  Section,
  Recipe,
  Category,
  Ingredient,
} from '@cs/utils/zod';

import {
  createRecipe,
  createSection,
  publishRecipe,
  createCategory,
  createIngredient,
  deleteIngredient,
} from './utils';
import app from '../src';
import { env } from 'cloudflare:test';
import { executionCtx } from './mocks';
import { signUp, signIn } from './utils/auth';
import { setRole, deleteRecipes, deleteCategories } from './utils/db';

describe('Ingredients route - /api/recipes/:recipeId/sections/:sectionId/ingredients', () => {
  let cookie: string;
  let recipeId: string;
  let sectionId: string;
  let ingredientId: string;

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

    res = await createSection(recipeId, { Cookie: cookie });
    sectionId = (await res.json<Section>()).id;

    res = await publishRecipe(recipeId, { Cookie: cookie });
  });

  it('Should not return any ingredients - GET /api/recipes/:recipeId/sections/:sectionId/ingredients', async () => {
    const res = await app.request(
      `/api/recipes/${recipeId}/sections/${sectionId}/ingredients`,
      {},
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject([]);
  });

  it('Should not create an ingredient due to invalid section id - POST /api/recipes/:recipeId/sections/:sectionId/ingredients', async ({
    headers,
  }) => {
    const res = await createIngredient(recipeId, '0000000000000000', {
      ...headers,
      Cookie: cookie,
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      error: 'Section not found',
    });
  });

  it('Should create an ingredient - POST /api/recipes/:recipeId/sections/:sectionId/ingredients', async ({
    headers,
  }) => {
    const res = await createIngredient(recipeId, sectionId, {
      ...headers,
      Cookie: cookie,
    });

    const json = await res.json<Ingredient>();

    expect(res.status).toBe(201);
    expect(json).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      unit: expect.any(String),
      amount: expect.any(Number),
      position: expect.any(Number),
    });

    ingredientId = json.id;
  });

  it('Should return ingredients - GET /api/recipes/:recipeId/sections/:sectionId/ingredients', async () => {
    const res = await app.request(
      `/api/recipes/${recipeId}/sections/${sectionId}/ingredients`,
      {},
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject([{ id: ingredientId }]);
  });

  it('Should not update an ingredient due to duplicate position - PUT /api/recipes/:recipeId/sections/:sectionId/ingredients', async ({
    headers,
  }) => {
    let res = await createIngredient(
      recipeId,
      sectionId,
      { ...headers, Cookie: cookie },
      'Test 2',
    );
    const { id } = await res.json<Ingredient>();

    res = await app.request(
      `/api/recipes/${recipeId}/sections/${sectionId}/ingredients`,
      {
        method: 'PUT',
        headers: {
          ...headers,
          Cookie: cookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            id: ingredientId,
            position: 1,
          },
        ]),
      },
      env,
      executionCtx,
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: 'Ingredient already exists',
    });

    await deleteIngredient(recipeId, sectionId, id, {
      ...headers,
      Cookie: cookie,
    });
  });

  it('Should update an ingredient - PUT /api/recipes/:recipeId/sections/:sectionId/ingredients', async ({
    headers,
  }) => {
    const res = await app.request(
      `/api/recipes/${recipeId}/sections/${sectionId}/ingredients`,
      {
        method: 'PUT',
        headers: {
          ...headers,
          Cookie: cookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            id: ingredientId,
            translations: [
              {
                name: 'Test 3',
                unit: 'kg',
                amount: 2,
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
        id: ingredientId,
        name: 'Test 3',
        unit: 'kg',
        amount: 2,
        position: expect.any(Number),
      },
    ]);
  });

  it('Should not delete an ingredient due to invalid id - DELETE /api/recipes/:recipeId/sections/:sectionId/ingredients/:ingredientId', async ({
    headers,
  }) => {
    const res = await deleteIngredient(
      recipeId,
      sectionId,
      '0000000000000000',
      {
        ...headers,
        Cookie: cookie,
      },
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      error: 'Ingredient not found',
    });
  });

  it('Should delete an ingredient - DELETE /api/recipes/:recipeId/sections/:sectionId/ingredients/:ingredientId', async ({
    headers,
  }) => {
    const res = await deleteIngredient(recipeId, sectionId, ingredientId, {
      ...headers,
      Cookie: cookie,
    });

    expect(res.status).toBe(204);
  });
});
