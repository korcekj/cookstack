import type { Env } from '../types';

import {
  getRecipesSchema,
  getCategorySchema,
  getCategoriesSchema,
  createCategorySchema,
  updateCategorySchema,
} from '@cs/utils/zod';
import { Hono } from 'hono';
import {
  categories as categoriesTable,
  categoriesTranslations,
} from '../services/db/schema';
import { eq } from 'drizzle-orm';
import { slugify } from '@cs/utils';
import { initializeDB } from '../services/db';
import { useTranslation } from '@intlify/hono';
import { generateIdFromEntropySize } from 'lucia';
import { verifyAuthor } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rate-limit';
import { getConflictUpdateSetter } from '../services/db/helpers';
import { useCategories, useRecipes } from '../services/db/queries';
import { validator, validateCategory } from '../middlewares/validation';

const categories = new Hono<Env>();

categories.use(rateLimit);

categories.get('/', validator('query', getCategoriesSchema), async (c) => {
  const options = c.req.valid('query');
  const { limit, offset } = options;

  const { categories, total } = await useCategories(c, options);
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);

  return c.json({ categories, total, page, pages });
});

categories.post(
  '/',
  verifyAuthor,
  validator('json', createCategorySchema),
  async (c) => {
    const t = useTranslation(c);
    const { translations } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    const categoryId = generateIdFromEntropySize(10);

    try {
      await db.batch([
        db.insert(categoriesTable).values({
          id: categoryId,
        }),
        db.insert(categoriesTranslations).values(
          translations.map((v) => ({
            categoryId,
            slug: slugify(v.name),
            ...v,
          }))
        ),
      ]);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: UNIQUE')) {
          return c.json({ error: t('category.duplicate') }, 409);
        }
      }

      throw err;
    }

    return c.json({ category: { id: categoryId } }, 201);
  }
);

categories.get(
  '/:categoryId',
  validator('param', getCategorySchema),
  validateCategory,
  async (c) => {
    const options = c.req.valid('param');

    const { categories } = await useCategories(c, options);

    return c.json({ category: categories[0] });
  }
);

categories.get(
  '/:categoryId/recipes',
  validator('param', getCategorySchema),
  validateCategory,
  validator('query', getRecipesSchema),
  async (c) => {
    const param = c.req.valid('param');
    const query = c.req.valid('query');
    const { limit, offset } = query;

    const { recipes, total } = await useRecipes(c, { ...query, ...param });
    const page = Math.floor(offset / limit) + 1;
    const pages = Math.ceil(total / limit);

    return c.json({ recipes, total, page, pages });
  }
);

categories.patch(
  '/:categoryId',
  verifyAuthor,
  validator('param', getCategorySchema),
  validateCategory,
  validator('json', updateCategorySchema),
  async (c) => {
    const t = useTranslation(c);
    const { categoryId } = c.req.valid('param');
    const { translations } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    try {
      await db.batch([
        db
          .update(categoriesTable)
          .set({ updatedAt: new Date() })
          .where(eq(categoriesTable.id, categoryId)),
        db
          .insert(categoriesTranslations)
          .values(
            translations.map((v) => ({
              ...v,
              categoryId,
              slug: slugify(v.name),
            }))
          )
          .onConflictDoUpdate({
            target: [
              categoriesTranslations.language,
              categoriesTranslations.categoryId,
            ],
            set: getConflictUpdateSetter(categoriesTranslations, [
              'name',
              'slug',
            ]),
          }),
      ]);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: UNIQUE')) {
          return c.json({ error: t('category.duplicate') }, 409);
        }
      }

      throw err;
    }

    return c.body(null, 204);
  }
);

categories.delete(
  '/:categoryId',
  verifyAuthor,
  validator('param', getCategorySchema),
  validateCategory,
  async (c) => {
    const t = useTranslation(c);
    const { categoryId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);

    try {
      await db
        .delete(categoriesTable)
        .where(eq(categoriesTable.id, categoryId));
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: FOREIGN KEY')) {
          return c.json({ error: t('category.containsRecipe') }, 404);
        }
      }

      throw err;
    }

    return c.body(null, 204);
  }
);

export default categories;
