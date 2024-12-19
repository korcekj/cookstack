import type { Env } from '../types';

import {
  getRecipeSchema,
  getSectionSchema,
  createSectionSchema,
  updateSectionSchema,
} from '@cs/utils/zod';
import { Hono } from 'hono';
import {
  sectionsTranslations,
  sections as sectionsTable,
} from '../services/db/schema';
import {
  validator,
  validateRecipe,
  validateSection,
} from '../middlewares/validation';
import { eq, inArray } from 'drizzle-orm';
import { initializeDB } from '../services/db';
import { verifyRoles } from '../middlewares/auth';
import rateLimit from '../middlewares/rate-limit';
import { generateId, pick, omit } from '@cs/utils';
import { useSections } from '../services/db/queries';

import ingredients from './ingredients';
import instructions from './instructions';

const sections = new Hono<Env>();

sections.use(rateLimit);

sections.get(
  '/',
  validator('param', getRecipeSchema),
  validateRecipe,
  async c => {
    const options = c.req.valid('param');

    const sections = await useSections(c, options);

    return c.json(sections);
  },
);

sections.post(
  '/',
  verifyRoles(['author', 'admin']),
  validator('param', getRecipeSchema),
  validateRecipe,
  validator('json', createSectionSchema),
  async c => {
    const { t, locale } = c.get('i18n');
    const { recipeId } = c.req.valid('param');
    const { translations, ...section } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    const sectionId = generateId(16);

    try {
      const position = await db.$count(
        sectionsTable,
        eq(sectionsTable.recipeId, recipeId),
      );
      const [[insert1], insert2] = await db.batch([
        db
          .insert(sectionsTable)
          .values({ ...section, id: sectionId, recipeId, position })
          .returning(),
        db
          .insert(sectionsTranslations)
          .values(
            translations.map(v => ({
              ...v,
              sectionId,
            })),
          )
          .returning(),
      ]);

      const translation = insert2.find(v => v.language === locale());
      return c.json(
        {
          ...omit(insert1, ['recipeId']),
          ...(translation ? pick(translation, ['name']) : {}),
        },
        201,
      );
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: UNIQUE')) {
          return c.json({ error: t('section.duplicate') }, 409);
        }
      }

      throw err;
    }
  },
);

sections.put(
  '/',
  verifyRoles(['author', 'admin']),
  validator('param', getRecipeSchema),
  validateRecipe,
  validator('json', updateSectionSchema),
  async c => {
    const { t } = c.get('i18n');
    const body = c.req.valid('json');
    const options = c.req.valid('param');
    const { recipeId } = options;

    const db = initializeDB(c.env.DB);

    const sections = body.map(({ id, ...rest }) => ({
      ...rest,
      id: id ?? generateId(16),
    }));

    const translations = sections
      .map(
        ({ id, translations }) =>
          translations?.map(v => ({ ...v, sectionId: id })) ?? [],
      )
      .flat();

    try {
      let total = await db.$count(
        sectionsTable,
        eq(sectionsTable.recipeId, recipeId),
      );
      const [_1, _2, _3, results] = await db.batch([
        db.delete(sectionsTable).where(
          inArray(
            sectionsTable.id,
            sections.map(({ id }) => id),
          ),
        ),
        db.insert(sectionsTable).values(
          sections.map(({ id, position }) => ({
            id,
            recipeId,
            position: position ?? total++,
          })),
        ),
        ...(translations.length
          ? [db.insert(sectionsTranslations).values(translations)]
          : []),
        useSections(c, options),
      ]);

      return c.json(results);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: UNIQUE')) {
          return c.json({ error: t('section.duplicate') }, 409);
        }
      }

      throw err;
    }
  },
);

sections.delete(
  '/:sectionId',
  verifyRoles(['author', 'admin']),
  validator('param', getSectionSchema),
  validateSection,
  async c => {
    const { sectionId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);

    await db.delete(sectionsTable).where(eq(sectionsTable.id, sectionId));

    return c.body(null, 204);
  },
);

sections.route('/:sectionId/ingredients', ingredients);
sections.route('/:sectionId/instructions', instructions);

export default sections;
