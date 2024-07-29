import type {
  GetCategoryInput,
  GetCategoriesInput,
  CategoriesOrderByColumns,
} from '@cs/utils/zod';
import type { Context } from 'hono';
import type { Env } from '../types';

import {
  initializeDB,
  getOrderByClauses,
  getConflictUpdateSetter,
} from '../db';
import {
  categories as categoriesTable,
  categoriesTranslations,
} from '../db/schema';
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesSchema,
  getCategorySchema,
} from '@cs/utils/zod';
import { Hono } from 'hono';
import { slugify } from '@cs/utils';
import { getLocale } from '../utils';
import { count, eq, and } from 'drizzle-orm';
import { useTranslation } from '@intlify/hono';
import { generateIdFromEntropySize } from 'lucia';
import { verifyAuthor } from '../middlewares/auth';
import { validator } from '../middlewares/validation';
import { rateLimit } from '../middlewares/rate-limit';

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

categories.patch(
  '/:categoryId',
  verifyAuthor,
  validator('param', getCategorySchema),
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
        } else if (err.message.includes('D1_ERROR: FOREIGN KEY')) {
          return c.json({ error: t('category.notFound') }, 404);
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
  async (c) => {
    const t = useTranslation(c);
    const { categoryId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);

    const result = await db
      .delete(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .returning({ id: categoriesTable.id });

    if (!result.length) return c.json({ error: t('category.notFound') }, 404);

    return c.body(null, 204);
  }
);

categories.get('/', validator('query', getCategoriesSchema), async (c) => {
  const options = c.req.valid('query');
  const { limit, offset } = options;

  const { categories, total } = await getCategories(c, options);
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);

  return c.json({ categories, total, page, pages });
});

categories.get(
  '/:categoryId',
  validator('param', getCategorySchema),
  async (c) => {
    const t = useTranslation(c);
    const options = c.req.valid('param');
    const { categories } = await getCategories(c, options);
    if (!categories.length)
      return c.json({ error: t('category.notFound') }, 404);

    return c.json({ category: categories[0] });
  }
);

const getCategories = async (
  c: Context<Env>,
  options: GetCategoryInput | GetCategoriesInput
) => {
  const locale = getLocale(c);

  const db = initializeDB(c.env.DB);

  const query = db
    .select({
      id: categoriesTable.id,
      name: categoriesTranslations.name,
      slug: categoriesTranslations.slug,
      createdAt: categoriesTable.createdAt,
      updatedAt: categoriesTable.updatedAt,
    })
    .from(categoriesTable)
    .innerJoin(
      categoriesTranslations,
      and(
        eq(categoriesTranslations.categoryId, categoriesTable.id),
        eq(categoriesTranslations.language, locale)
      )
    );

  if ('categoryId' in options) {
    query.$dynamic().where(eq(categoriesTable.id, options.categoryId));
  }

  if ('orderBy' in options) {
    const orderByClauses = getOrderByClauses<CategoriesOrderByColumns>(
      options.orderBy,
      (value) => {
        switch (value) {
          case 'name':
            return categoriesTranslations.name;
          default:
            throw new Error(`Invalid column name: ${value}`);
        }
      }
    );
    query.$dynamic().orderBy(...orderByClauses);
  }

  if ('limit' in options && 'offset' in options) {
    query.$dynamic().limit(options.limit).offset(options.offset);
  }

  const [categories, [{ count: total }]] = await db.batch([
    query,
    db.select({ count: count() }).from(categoriesTable),
  ]);

  return { categories, total };
};

export default categories;
