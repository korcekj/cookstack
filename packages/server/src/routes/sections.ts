import type { Env } from '../types';

import {
  getRecipeSchema,
  getSectionSchema,
  createSectionSchema,
  updateSectionSchema,
} from '@cs/utils/zod';
import { Hono } from 'hono';
import {
  validator,
  validateRecipe,
  validateSection,
} from '../middlewares/validation';
import { getLocale } from '../utils';
import { initializeDB } from '../db';
import { useTranslation } from '@intlify/hono';
import { generateIdFromEntropySize } from 'lucia';
import { verifyAuthor } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rate-limit';
import { eq, and, asc, count, inArray } from 'drizzle-orm';
import { sectionsTranslations, sections as sectionsTable } from '../db/schema';

import ingredients from './ingredients';

const sections = new Hono<Env>();

sections.use(rateLimit);

sections.get(
  '/',
  validator('param', getRecipeSchema),
  validateRecipe,
  async (c) => {
    const locale = getLocale(c);
    const { recipeId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);

    const sections = await db
      .select({
        id: sectionsTable.id,
        name: sectionsTranslations.name,
        position: sectionsTable.position,
      })
      .from(sectionsTable)
      .innerJoin(
        sectionsTranslations,
        and(
          eq(sectionsTranslations.sectionId, sectionsTable.id),
          eq(sectionsTranslations.language, locale)
        )
      )
      .where(eq(sectionsTable.recipeId, recipeId))
      .orderBy(asc(sectionsTable.position));

    return c.json({ sections });
  }
);

sections.post(
  '/',
  verifyAuthor,
  validator('param', getRecipeSchema),
  validateRecipe,
  validator('json', createSectionSchema),
  async (c) => {
    const t = useTranslation(c);
    const { recipeId } = c.req.valid('param');
    const { translations, ...section } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    const sectionId = generateIdFromEntropySize(10);

    try {
      const [{ position }] = await db
        .select({ position: count() })
        .from(sectionsTable)
        .where(eq(sectionsTable.recipeId, recipeId));
      await db.batch([
        db
          .insert(sectionsTable)
          .values({ ...section, id: sectionId, recipeId, position }),
        db.insert(sectionsTranslations).values(
          translations.map((v) => ({
            ...v,
            sectionId,
          }))
        ),
      ]);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: UNIQUE')) {
          return c.json({ error: t('section.duplicate') }, 409);
        }
      }

      throw err;
    }

    return c.json({ section: { id: sectionId } }, 201);
  }
);

sections.put(
  '/',
  verifyAuthor,
  validator('param', getRecipeSchema),
  validateRecipe,
  validator('json', updateSectionSchema),
  async (c) => {
    const t = useTranslation(c);
    const { recipeId } = c.req.valid('param');
    const body = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    const sections = body.map(({ id, ...rest }) => ({
      ...rest,
      id: id ?? generateIdFromEntropySize(10),
    }));

    const translations = sections
      .map(
        ({ id, translations }) =>
          translations?.map((v) => ({ ...v, sectionId: id })) ?? []
      )
      .flat();

    try {
      let [{ total }] = await db
        .select({ total: count() })
        .from(sectionsTable)
        .where(eq(sectionsTable.recipeId, recipeId));
      await db.batch([
        db.delete(sectionsTable).where(
          inArray(
            sectionsTable.id,
            sections.map(({ id }) => id)
          )
        ),
        db.insert(sectionsTable).values(
          sections.map(({ id, position }) => ({
            id,
            recipeId,
            position: position ?? total++,
          }))
        ),
        ...(translations.length
          ? [db.insert(sectionsTranslations).values(translations)]
          : []),
      ]);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: UNIQUE')) {
          return c.json({ error: t('section.duplicate') }, 409);
        }
      }

      throw err;
    }

    // TODO: return 200 and list all sections with their statuses (201 - created/200 - updated)
    return c.body(null, 204);
  }
);

sections.delete(
  '/:sectionId',
  verifyAuthor,
  validator('param', getSectionSchema),
  validateSection,
  async (c) => {
    const { sectionId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);

    await db.delete(sectionsTable).where(eq(sectionsTable.id, sectionId));

    return c.body(null, 204);
  }
);

sections.route('/:sectionId/ingredients', ingredients);

export default sections;
