import type {
  User,
  Section,
  Recipe,
  Category,
  Instruction,
} from '@cs/utils/zod';

import {
  createRecipe,
  createSection,
  publishRecipe,
  createCategory,
  createInstruction,
  deleteInstruction,
} from './utils';
import app from '../src';
import { env } from 'cloudflare:test';
import { executionCtx } from './mocks';
import { signUp, signIn } from './utils/auth';
import { setRole, deleteRecipes, deleteCategories } from './utils/db';

describe('Instructions route - /api/recipes/:recipeId/sections/:sectionId/instructions', () => {
  let cookie: string;
  let recipeId: string;
  let sectionId: string;
  let instructionId: string;

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

  it('Should not create an instruction due to invalid section id - POST /api/recipes/:recipeId/sections/:sectionId/instructions', async ({
    headers,
  }) => {
    const res = await createInstruction(recipeId, '0000000000000000', {
      ...headers,
      Cookie: cookie,
    });

    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      error: 'Section not found',
    });
  });

  it('Should create an instruction - POST /api/recipes/:recipeId/sections/:sectionId/instructions', async ({
    headers,
  }) => {
    const res = await createInstruction(recipeId, sectionId, {
      ...headers,
      Cookie: cookie,
    });

    const json = await res.json<Instruction>();

    expect(res.status).toBe(201);
    expect(json).toMatchObject({
      id: expect.any(String),
      text: expect.any(String),
      position: expect.any(Number),
    });

    instructionId = json.id;
  });

  it('Should return instructions - GET /api/recipes/:recipeId/sections/:sectionId/instructions', async () => {
    const res = await app.request(
      `/api/recipes/${recipeId}/sections/${sectionId}/instructions`,
      {},
      env,
      executionCtx,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject([
      {
        id: instructionId,
      },
    ]);
  });

  it('Should not update an instruction due to duplicate position - PUT /api/recipes/:recipeId/sections/:sectionId/instructions', async ({
    headers,
  }) => {
    let res = await createInstruction(recipeId, sectionId, {
      ...headers,
      Cookie: cookie,
    });
    const { id } = await res.json<Instruction>();

    res = await app.request(
      `/api/recipes/${recipeId}/sections/${sectionId}/instructions`,
      {
        method: 'PUT',
        headers: {
          ...headers,
          Cookie: cookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            id: instructionId,
            position: 1,
          },
        ]),
      },
      env,
      executionCtx,
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({
      error: 'Instruction already exists',
    });

    await deleteInstruction(recipeId, sectionId, id, {
      ...headers,
      Cookie: cookie,
    });
  });

  it('Should update an instruction - PUT /api/recipes/:recipeId/sections/:sectionId/instructions', async ({
    headers,
  }) => {
    const res = await app.request(
      `/api/recipes/${recipeId}/sections/${sectionId}/instructions`,
      {
        method: 'PUT',
        headers: {
          ...headers,
          Cookie: cookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            id: instructionId,
            translations: [
              {
                text: 'Test 3',
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
        id: instructionId,
        text: 'Test 3',
        position: expect.any(Number),
      },
    ]);
  });

  it('Should not delete an instruction due to invalid id - DELETE /api/recipes/:recipeId/sections/:sectionId/instructions/:instructionId', async ({
    headers,
  }) => {
    const res = await deleteInstruction(
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
      error: 'Instruction not found',
    });
  });

  it('Should delete an instruction - DELETE /api/recipes/:recipeId/sections/:sectionId/instructions/:instructionId', async ({
    headers,
  }) => {
    const res = await deleteInstruction(recipeId, sectionId, instructionId, {
      ...headers,
      Cookie: cookie,
    });

    expect(res.status).toBe(204);
  });
});
