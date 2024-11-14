import type {
  z,
  GetRecipeInput,
  GetSectionInput,
  GetCategoryInput,
  GetIngredientInput,
  GetInstructionInput,
} from '@cs/utils/zod';
import type { Env } from '../types';
import type { ValidationTargets } from 'hono';

import { parseError } from '@cs/utils/zod';
import { initializeDB } from '../services/db';
import { createMiddleware } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';

export const validator = <T extends z.ZodType<any, z.ZodTypeDef, any>>(
  target: keyof ValidationTargets,
  schema: T,
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const error = parseError(result.error);
      return c.json({ error }, 400);
    }
  });

export const validateCategory = createMiddleware<Env>(async (c, next) => {
  const { t } = c.get('i18n');
  const { categoryId } = c.req.param() as GetCategoryInput;

  const db = initializeDB(c.env.DB);

  const category = await db.query.categories.findFirst({
    columns: { id: true },
    where: (t, { eq }) => eq(t.id, categoryId),
  });
  if (!category) {
    throw new HTTPException(404, { message: t('category.notFound') });
  }

  return next();
});

export const validateRecipe = createMiddleware<Env>(async (c, next) => {
  const { t } = c.get('i18n');
  const { recipeId } = c.req.param() as GetRecipeInput;

  const db = initializeDB(c.env.DB);

  const recipe = await db.query.recipes.findFirst({
    columns: { id: true },
    where: (t, { eq }) => eq(t.id, recipeId),
  });
  if (!recipe) throw new HTTPException(404, { message: t('recipe.notFound') });

  return next();
});

export const validateSection = createMiddleware<Env>(async (c, next) => {
  const { t } = c.get('i18n');
  const { recipeId, sectionId } = c.req.param() as GetSectionInput;

  const db = initializeDB(c.env.DB);

  const section = await db.query.sections.findFirst({
    columns: { id: true },
    where: (t, { and, eq }) =>
      and(eq(t.id, sectionId), eq(t.recipeId, recipeId)),
  });
  if (!section) {
    throw new HTTPException(404, { message: t('section.notFound') });
  }

  return next();
});

export const validateIngredient = createMiddleware<Env>(async (c, next) => {
  const { t } = c.get('i18n');
  const { sectionId, ingredientId } = c.req.param() as GetIngredientInput;

  const db = initializeDB(c.env.DB);

  const ingredient = await db.query.ingredients.findFirst({
    columns: { id: true },
    where: (t, { and, eq }) =>
      and(eq(t.id, ingredientId), eq(t.sectionId, sectionId)),
  });
  if (!ingredient) {
    throw new HTTPException(404, { message: t('ingredient.notFound') });
  }

  return next();
});

export const validateInstruction = createMiddleware<Env>(async (c, next) => {
  const { t } = c.get('i18n');
  const { sectionId, instructionId } = c.req.param() as GetInstructionInput;

  const db = initializeDB(c.env.DB);

  const instruction = await db.query.instructions.findFirst({
    columns: { id: true },
    where: (t, { and, eq }) =>
      and(eq(t.id, instructionId), eq(t.sectionId, sectionId)),
  });
  if (!instruction) {
    throw new HTTPException(404, { message: t('instruction.notFound') });
  }

  return next();
});
