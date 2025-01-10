import app from '../../src';
import { env } from 'cloudflare:test';
import { executionCtx } from '../mocks';

export const defaultHeaders = {
  Origin: '',
  'Accept-Language': 'en',
};

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

export const publishRecipe = async (recipeId: string, headers = {}) => {
  return app.request(
    `/api/recipes/${recipeId}/publish`,
    {
      method: 'PATCH',
      headers: {
        ...defaultHeaders,
        ...headers,
      },
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

export const createSection = async (
  recipeId: string,
  headers = {},
  name = 'Test 1',
) => {
  return app.request(
    `/api/recipes/${recipeId}/sections`,
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

export const deleteSection = async (
  recipeId: string,
  sectionId: string,
  headers = {},
) => {
  return app.request(
    `/api/recipes/${recipeId}/sections/${sectionId}`,
    {
      method: 'DELETE',
      headers,
    },
    env,
    executionCtx,
  );
};

export const createIngredient = async (
  recipeId: string,
  sectionId: string,
  headers: {},
  name = 'Test 1',
) => {
  return app.request(
    `/api/recipes/${recipeId}/sections/${sectionId}/ingredients`,
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
            unit: 'g',
            amount: 1,
            language: 'en',
          },
        ],
      }),
    },
    env,
    executionCtx,
  );
};

export const deleteIngredient = async (
  recipeId: string,
  sectionId: string,
  ingredientId: string,
  headers: {},
) => {
  return app.request(
    `/api/recipes/${recipeId}/sections/${sectionId}/ingredients/${ingredientId}`,
    {
      method: 'DELETE',
      headers,
    },
    env,
    executionCtx,
  );
};

export const createInstruction = async (
  recipeId: string,
  sectionId: string,
  headers: {},
  text = 'Test 1',
) => {
  return app.request(
    `/api/recipes/${recipeId}/sections/${sectionId}/instructions`,
    {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        translations: [
          {
            text,
            language: 'en',
          },
        ],
      }),
    },
    env,
    executionCtx,
  );
};

export const deleteInstruction = async (
  recipeId: string,
  sectionId: string,
  instructionId: string,
  headers: {},
) => {
  return app.request(
    `/api/recipes/${recipeId}/sections/${sectionId}/instructions/${instructionId}`,
    {
      method: 'DELETE',
      headers,
    },
    env,
    executionCtx,
  );
};
