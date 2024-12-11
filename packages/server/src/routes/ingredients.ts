import type { Env } from '../types';

import {
  getSectionSchema,
  getIngredientSchema,
  createIngredientSchema,
  updateIngredientSchema,
} from '@cs/utils/zod';
import { Hono } from 'hono';
import {
  ingredientsTranslations,
  ingredients as ingredientsTable,
} from '../services/db/schema';
import {
  validator,
  validateSection,
  validateIngredient,
} from '../middlewares/validation';
import { generateId } from '@cs/utils';
import { eq, inArray } from 'drizzle-orm';
import { initializeDB } from '../services/db';
import rateLimit from '../middlewares/rate-limit';
import { verifyAuthor } from '../middlewares/auth';
import { useIngredients } from '../services/db/queries';

const ingredients = new Hono<Env>();

ingredients.use(rateLimit);

ingredients.post(
  '/',
  verifyAuthor,
  validator('param', getSectionSchema),
  validateSection,
  validator('json', createIngredientSchema),
  async c => {
    const { t } = c.get('i18n');
    const { sectionId } = c.req.valid('param');
    const { translations, ...ingredient } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    const ingredientId = generateId(16);

    try {
      const position = await db.$count(
        ingredientsTable,
        eq(ingredientsTable.sectionId, sectionId),
      );
      await db.batch([
        db.insert(ingredientsTable).values({
          ...ingredient,
          position,
          sectionId,
          id: ingredientId,
        }),
        db.insert(ingredientsTranslations).values(
          translations.map(v => ({
            ...v,
            ingredientId,
          })),
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

    return c.json({ id: ingredientId }, 201);
  },
);

ingredients.get(
  '/',
  validator('param', getSectionSchema),
  validateSection,
  async c => {
    const options = c.req.valid('param');

    const ingredients = await useIngredients(c, options);

    return c.json(ingredients);
  },
);

ingredients.put(
  '/',
  verifyAuthor,
  validator('param', getSectionSchema),
  validateSection,
  validator('json', updateIngredientSchema),
  async c => {
    const { t } = c.get('i18n');
    const body = c.req.valid('json');
    const options = c.req.valid('param');
    const { sectionId } = options;

    const db = initializeDB(c.env.DB);

    const ingredients = body.map(({ id, ...rest }) => ({
      ...rest,
      id: id ?? generateId(16),
    }));

    const translations = ingredients
      .map(
        ({ id, translations }) =>
          translations?.map(v => ({ ...v, ingredientId: id })) ?? [],
      )
      .flat();

    try {
      let total = await db.$count(
        ingredientsTable,
        eq(ingredientsTable.sectionId, sectionId),
      );
      const [_1, _2, _3, results] = await db.batch([
        db.delete(ingredientsTable).where(
          inArray(
            ingredientsTable.id,
            ingredients.map(({ id }) => id),
          ),
        ),
        db.insert(ingredientsTable).values(
          ingredients.map(({ id, position }) => ({
            id,
            sectionId,
            position: position ?? total++,
          })),
        ),
        ...(translations.length
          ? [db.insert(ingredientsTranslations).values(translations)]
          : []),
        useIngredients(c, options),
      ]);

      return c.json(results);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: UNIQUE')) {
          return c.json({ error: t('ingredient.duplicate') }, 409);
        }
      }

      throw err;
    }
  },
);

ingredients.delete(
  '/:ingredientId',
  verifyAuthor,
  validator('param', getIngredientSchema),
  validateIngredient,
  async c => {
    const { ingredientId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);

    await db
      .delete(ingredientsTable)
      .where(eq(ingredientsTable.id, ingredientId));

    return c.body(null, 204);
  },
);

export default ingredients;
