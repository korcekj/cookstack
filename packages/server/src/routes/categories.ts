import type { Env } from '../types';
import type { CategoriesOrderByColumns } from '@cs/utils/zod';

import {
  categories as categoriesTable,
  categoriesTranslations,
} from '../db/schema';
import { Hono } from 'hono';
import { slugify } from '@cs/utils';
import { initializeDB } from '../db';
import { count, eq, and } from 'drizzle-orm';
import { useTranslation } from '@intlify/hono';
import { generateIdFromEntropySize } from 'lucia';
import { verifyAuthor } from '../middlewares/auth';
import { validator } from '../middlewares/validation';
import { rateLimit } from '../middlewares/rate-limit';
import { getOrderByClauses, getLocale } from '../utils';
import { createCategorySchema, getCategoriesSchema } from '@cs/utils/zod';

const categories = new Hono<Env>();

categories.use(rateLimit);

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

categories.get('/', validator('query', getCategoriesSchema), async (c) => {
  const locale = getLocale(c);
  const { limit, offset, orderBy } = c.req.valid('query');

  const db = initializeDB(c.env.DB);

  const orderByClauses = getOrderByClauses<CategoriesOrderByColumns>(
    orderBy,
    (value) => {
      switch (value) {
        case 'name':
          return categoriesTranslations.name;
        default:
          throw new Error(`Invalid column name: ${value}`);
      }
    }
  );

  const [categories, [{ count: total }]] = await db.batch([
    db
      .select({
        id: categoriesTable.id,
        name: categoriesTranslations.name,
        slug: categoriesTranslations.slug,
      })
      .from(categoriesTable)
      .innerJoin(
        categoriesTranslations,
        and(
          eq(categoriesTranslations.categoryId, categoriesTable.id),
          eq(categoriesTranslations.language, locale)
        )
      )
      .orderBy(...orderByClauses)
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(categoriesTable),
  ]);
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);

  return c.json({ categories, total, page, pages });
});

export default categories;
