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
import { eq, and, asc } from 'drizzle-orm';
import { useTranslation } from '@intlify/hono';
import { generateIdFromEntropySize } from 'lucia';
import { verifyAuthor } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rate-limit';
import { initializeDB, getConflictUpdateSetter } from '../db';
import { sectionsTranslations, sections as sectionsTable } from '../db/schema';

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
        order: sectionsTable.order,
        createAt: sectionsTable.createdAt,
        updatedAt: sectionsTable.updatedAt,
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
      .orderBy(asc(sectionsTable.order));

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
      await db.batch([
        db
          .insert(sectionsTable)
          .values({ ...section, id: sectionId, recipeId }),
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

sections.patch(
  '/:sectionId',
  verifyAuthor,
  validator('param', getSectionSchema),
  validateSection,
  validator('json', updateSectionSchema),
  async (c) => {
    const t = useTranslation(c);
    const { sectionId } = c.req.valid('param');
    const { translations, ...section } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    try {
      await db.batch([
        db
          .update(sectionsTable)
          .set({ ...section, updatedAt: new Date() })
          .where(eq(sectionsTable.id, sectionId)),
        ...(translations
          ? [
              db
                .insert(sectionsTranslations)
                .values(
                  translations.map((v) => ({
                    ...v,
                    sectionId,
                  }))
                )
                .onConflictDoUpdate({
                  target: [
                    sectionsTranslations.language,
                    sectionsTranslations.sectionId,
                  ],
                  set: getConflictUpdateSetter(sectionsTranslations, [
                    'name',
                    'language',
                  ]),
                }),
            ]
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

export default sections;
