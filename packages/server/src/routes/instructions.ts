import type { Env } from '../types';

import {
  instructionsTranslations,
  instructions as instructionsTable,
} from '../db/schema';
import {
  getSectionSchema,
  getInstructionSchema,
  createInstructionSchema,
  updateInstructionSchema,
} from '@cs/utils/zod';
import { Hono } from 'hono';
import {
  validator,
  validateSection,
  validateInstruction,
} from '../middlewares/validation';
import { initializeDB } from '../db';
import { useTranslation } from '@intlify/hono';
import { useInstructions } from '../db/queries';
import { eq, count, inArray } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';
import { verifyAuthor } from '../middlewares/auth';
import { rateLimit } from '../middlewares/rate-limit';

const instructions = new Hono<Env>();

instructions.use(rateLimit);

instructions.post(
  '/',
  verifyAuthor,
  validator('param', getSectionSchema),
  validateSection,
  validator('json', createInstructionSchema),
  async (c) => {
    const t = useTranslation(c);
    const { sectionId } = c.req.valid('param');
    const { translations, ...instruction } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    const instructionId = generateIdFromEntropySize(10);

    try {
      const position = await db.$count(
        instructionsTable,
        eq(instructionsTable.sectionId, sectionId)
      );
      await db.batch([
        db.insert(instructionsTable).values({
          ...instruction,
          position,
          sectionId,
          id: instructionId,
        }),
        db.insert(instructionsTranslations).values(
          translations.map((v) => ({
            ...v,
            instructionId,
          }))
        ),
      ]);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: UNIQUE')) {
          return c.json({ error: t('instruction.duplicate') }, 409);
        }
      }

      throw err;
    }

    return c.json({ instruction: { id: instructionId } }, 201);
  }
);

instructions.get(
  '/',
  validator('param', getSectionSchema),
  validateSection,
  async (c) => {
    const options = c.req.valid('param');

    const instructions = await useInstructions(c, options);

    return c.json({ instructions });
  }
);

instructions.put(
  '/',
  verifyAuthor,
  validator('param', getSectionSchema),
  validateSection,
  validator('json', updateInstructionSchema),
  async (c) => {
    const t = useTranslation(c);
    const body = c.req.valid('json');
    const options = c.req.valid('param');
    const { sectionId } = options;

    const db = initializeDB(c.env.DB);

    const instructions = body.map(({ id, ...rest }) => ({
      ...rest,
      id: id ?? generateIdFromEntropySize(10),
    }));

    const translations = instructions
      .map(
        ({ id, translations }) =>
          translations?.map((v) => ({ ...v, instructionId: id })) ?? []
      )
      .flat();

    try {
      let total = await db.$count(
        instructionsTable,
        eq(instructionsTable.sectionId, sectionId)
      );
      const [_1, _2, _3, results] = await db.batch([
        db.delete(instructionsTable).where(
          inArray(
            instructionsTable.id,
            instructions.map(({ id }) => id)
          )
        ),
        db.insert(instructionsTable).values(
          instructions.map(({ id, position }) => ({
            id,
            sectionId,
            position: position ?? total++,
          }))
        ),
        ...(translations.length
          ? [db.insert(instructionsTranslations).values(translations)]
          : []),
        useInstructions(c, options),
      ]);

      return c.json({ ingredients: results });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: UNIQUE')) {
          return c.json({ error: t('instruction.duplicate') }, 409);
        }
      }

      throw err;
    }
  }
);

instructions.delete(
  '/:instructionId',
  verifyAuthor,
  validator('param', getInstructionSchema),
  validateInstruction,
  async (c) => {
    const { instructionId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);

    await db
      .delete(instructionsTable)
      .where(eq(instructionsTable.id, instructionId));

    return c.body(null, 204);
  }
);

export default instructions;
