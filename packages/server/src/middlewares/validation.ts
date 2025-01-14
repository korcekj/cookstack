import type {
  GetRecipeInput,
  GetSectionInput,
  GetCategoryInput,
  GetIngredientInput,
  GetInstructionInput,
  GetRoleRequestInput,
} from '@cs/utils/zod';
import type { Env } from '../types';
import type { ValidationTargets } from 'hono';

import { z } from 'zod';
import { parseError } from '@cs/utils/zod';
import { initializeDB } from '../services/db';
import { createMiddleware } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { useRecipe } from '../services/db/queries';
import { verifyAuthor, verifyRoles } from './auth';
import { HTTPException } from 'hono/http-exception';

export const validator = <T extends z.ZodType<any, z.ZodTypeDef, any>>(
  target: keyof ValidationTargets,
  schema: T,
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const error = parseError(result.error);
      throw new HTTPException(400, {
        res: c.json({ error }),
      });
    }
  });

export const validateRoleRequest = createMiddleware<Env>(async (c, next) => {
  const { t } = c.get('i18n');
  const { requestId } = c.req.param() as GetRoleRequestInput;

  const db = initializeDB(c.env.DB);

  const request = await db.query.roleRequests.findFirst({
    columns: { id: true },
    where: (t, { and, eq }) =>
      and(eq(t.id, requestId), eq(t.status, 'pending')),
  });
  if (!request) {
    throw new HTTPException(404, { message: t('roleRequest.notFound') });
  }

  return next();
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

  const [recipe] = await useRecipe(c, { recipeId });
  if (!recipe) throw new HTTPException(404, { message: t('recipe.notFound') });

  c.set('recipe', recipe);
  c.set('author', recipe.user);

  return next();
});

export const validateRecipeDraft = createMiddleware<Env>(async (c, next) => {
  const recipe = c.get('recipe')!;
  if (recipe.status !== 'draft') {
    return next();
  }

  return verifyAuthor(verifyRoles(['admin']))(c, next);
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
