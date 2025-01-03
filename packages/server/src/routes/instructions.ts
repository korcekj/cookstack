import type { Env } from '../types';

import {
  getSectionSchema,
  getInstructionSchema,
  createInstructionSchema,
  updateInstructionSchema,
} from '@cs/utils/zod';
import { Hono } from 'hono';
import {
  instructionsTranslations,
  instructions as instructionsTable,
} from '../services/db/schema';
import {
  validator,
  validateSection,
  validateInstruction,
} from '../middlewares/validation';
import { eq, inArray } from 'drizzle-orm';
import { initializeDB } from '../services/db';
import { generateId, pick, omit } from '@cs/utils';
import { useInstructions } from '../services/db/queries';
import { verifyRoles, verifyAuthor } from '../middlewares/auth';

const instructions = new Hono<Env>();

instructions.post(
  '/',
  verifyAuthor(verifyRoles(['admin'])),
  validator('param', getSectionSchema),
  validateSection,
  validator('json', createInstructionSchema),
  async c => {
    const { t, locale } = c.get('i18n');
    const { sectionId } = c.req.valid('param');
    const { translations, ...instruction } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    const instructionId = generateId(16);

    try {
      const position = await db.$count(
        instructionsTable,
        eq(instructionsTable.sectionId, sectionId),
      );
      const [[insert1], insert2] = await db.batch([
        db
          .insert(instructionsTable)
          .values({
            ...instruction,
            position,
            sectionId,
            id: instructionId,
          })
          .returning(),
        db
          .insert(instructionsTranslations)
          .values(
            translations.map(v => ({
              ...v,
              instructionId,
            })),
          )
          .returning(),
      ]);

      const translation = insert2.find(v => v.language === locale());
      return c.json(
        {
          ...omit(insert1, ['sectionId']),
          ...(translation ? pick(translation, ['text']) : {}),
        },
        201,
      );
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: UNIQUE')) {
          return c.json({ error: t('instruction.duplicate') }, 409);
        }
      }

      throw err;
    }
  },
);

instructions.get(
  '/',
  validator('param', getSectionSchema),
  validateSection,
  async c => {
    const options = c.req.valid('param');

    const instructions = await useInstructions(c, options);

    return c.json(instructions);
  },
);

instructions.put(
  '/',
  verifyAuthor(verifyRoles(['admin'])),
  validator('param', getSectionSchema),
  validateSection,
  validator('json', updateInstructionSchema),
  async c => {
    const { t } = c.get('i18n');
    const body = c.req.valid('json');
    const options = c.req.valid('param');
    const { sectionId } = options;

    const db = initializeDB(c.env.DB);

    const instructions = body.map(({ id, ...rest }) => ({
      ...rest,
      id: id ?? generateId(16),
    }));

    const translations = instructions
      .map(
        ({ id, translations }) =>
          translations?.map(v => ({ ...v, instructionId: id })) ?? [],
      )
      .flat();

    try {
      let total = await db.$count(
        instructionsTable,
        eq(instructionsTable.sectionId, sectionId),
      );
      const [_1, _2, _3, ...get1] = await db.batch([
        db.delete(instructionsTable).where(
          inArray(
            instructionsTable.id,
            instructions.map(({ id }) => id),
          ),
        ),
        db.insert(instructionsTable).values(
          instructions.map(({ id, position }) => ({
            id,
            sectionId,
            position: position ?? total++,
          })),
        ),
        ...(translations.length
          ? [db.insert(instructionsTranslations).values(translations)]
          : []),
        useInstructions(c, options),
      ]);

      const [results] = get1.filter(v => Array.isArray(v));
      return c.json(results);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: UNIQUE')) {
          return c.json({ error: t('instruction.duplicate') }, 409);
        }
      }

      throw err;
    }
  },
);

instructions.delete(
  '/:instructionId',
  verifyAuthor(verifyRoles(['admin'])),
  validator('param', getInstructionSchema),
  validateInstruction,
  async c => {
    const { instructionId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);

    await db
      .delete(instructionsTable)
      .where(eq(instructionsTable.id, instructionId));

    return c.body(null, 204);
  },
);

export default instructions;
