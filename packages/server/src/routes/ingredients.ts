import type { Env } from '../types';

import {
  ingredientsTranslations,
  ingredients as ingredientsTable,
} from '../db/schema';
import {
  getSectionSchema,
  getIngredientSchema,
  createIngredientSchema,
  updateIngredientSchema,
} from '@cs/utils/zod';
import { Hono } from 'hono';
import {
  validator,
  validateSection,
  validateIngredient,
} from '../middlewares/validation';
import { initializeDB } from '../db';
import { getLocale } from '../utils';
import { useTotalCount } from '../db/query';
import { useTranslation } from '@intlify/hono';
import { generateIdFromEntropySize } from 'lucia';
import { verifyAuthor } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rate-limit';
import { eq, and, asc, inArray } from 'drizzle-orm';

const ingredients = new Hono<Env>();

ingredients.use(rateLimit);

ingredients.post(
  '/',
  verifyAuthor,
  validator('param', getSectionSchema),
  validateSection,
  validator('json', createIngredientSchema),
  async (c) => {
    const t = useTranslation(c);
    const { sectionId } = c.req.valid('param');
    const { translations, ...ingredient } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    const ingredientId = generateIdFromEntropySize(10);

    try {
      const position = await useTotalCount(c, ingredientsTable);
      await db.batch([
        db.insert(ingredientsTable).values({
          ...ingredient,
          position,
          sectionId,
          id: ingredientId,
        }),
        db.insert(ingredientsTranslations).values(
          translations.map((v) => ({
            ...v,
            ingredientId,
          }))
        ),
      ]);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: UNIQUE')) {
          return c.json({ error: t('ingredient.duplicate') }, 409);
        }
      }

      throw err;
    }

    return c.json({ ingredient: { id: ingredientId } });
  }
);

ingredients.get(
  '/',
  validator('param', getSectionSchema),
  validateSection,
  async (c) => {
    const locale = getLocale(c);
    const { sectionId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);

    const ingredients = await db
      .select({
        id: ingredientsTable.id,
        name: ingredientsTranslations.name,
        unit: ingredientsTranslations.unit,
        amount: ingredientsTranslations.amount,
        position: ingredientsTable.position,
      })
      .from(ingredientsTable)
      .innerJoin(
        ingredientsTranslations,
        and(
          eq(ingredientsTranslations.ingredientId, ingredientsTable.id),
          eq(ingredientsTranslations.language, locale)
        )
      )
      .where(eq(ingredientsTable.sectionId, sectionId))
      .orderBy(asc(ingredientsTable.position));

    return c.json({ ingredients });
  }
);

ingredients.put(
  '/',
  verifyAuthor,
  validator('param', getSectionSchema),
  validateSection,
  validator('json', updateIngredientSchema),
  async (c) => {
    const t = useTranslation(c);
    const { sectionId } = c.req.valid('param');
    const body = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    const ingredients = body.map(({ id, ...rest }) => ({
      ...rest,
      id: id ?? generateIdFromEntropySize(10),
    }));

    const translations = ingredients
      .map(
        ({ id, translations }) =>
          translations?.map((v) => ({ ...v, ingredientId: id })) ?? []
      )
      .flat();

    try {
      await db.batch([
        db.delete(ingredientsTable).where(
          inArray(
            ingredientsTable.id,
            ingredients.map(({ id }) => id)
          )
        ),
        db.insert(ingredientsTable).values(
          ingredients.map(({ id, position }) => ({
            id,
            position,
            sectionId,
          }))
        ),
        ...(translations.length
          ? [db.insert(ingredientsTranslations).values(translations)]
          : []),
      ]);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: UNIQUE')) {
          return c.json({ error: t('ingredient.duplicate') }, 409);
        }
      }

      throw err;
    }

    return c.body(null, 204);
  }
);

ingredients.delete(
  '/:ingredientId',
  verifyAuthor,
  validator('param', getIngredientSchema),
  validateIngredient,
  async (c) => {
    const { ingredientId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);

    await db
      .delete(ingredientsTable)
      .where(eq(ingredientsTable.id, ingredientId));

    return c.body(null, 204);
  }
);

export default ingredients;
