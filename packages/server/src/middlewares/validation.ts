import type { Env } from '../types';
import type { ValidationTargets } from 'hono';
import type { z, GetRecipeInput, GetSectionInput } from '@cs/utils/zod';

import { initializeDB } from '../db';
import { parseError } from '@cs/utils/zod';
import { useTranslation } from '@intlify/hono';
import { createMiddleware } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';

export const validator = <T extends z.ZodType<any, z.ZodTypeDef, any>>(
  target: keyof ValidationTargets,
  schema: T
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const error = parseError(result.error);
      return c.json({ error }, 400);
    }
  });

export const validateRecipe = createMiddleware<Env>(async (c, next) => {
  const t = useTranslation(c);
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
  const t = useTranslation(c);
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
