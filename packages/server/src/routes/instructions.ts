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
import { generateId } from '@cs/utils';
import { eq, inArray } from 'drizzle-orm';
import { initializeDB } from '../services/db';
import { verifyRoles } from '../middlewares/auth';
import rateLimit from '../middlewares/rate-limit';
import { useInstructions } from '../services/db/queries';

const instructions = new Hono<Env>();

instructions.use(rateLimit);

instructions.post(
  '/',
  verifyRoles(['author', 'admin']),
  validator('param', getSectionSchema),
  validateSection,
  validator('json', createInstructionSchema),
  async c => {
    const { t } = c.get('i18n');
    const { sectionId } = c.req.valid('param');
    const { translations, ...instruction } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    const instructionId = generateId(16);

    try {
      const position = await db.$count(
        instructionsTable,
        eq(instructionsTable.sectionId, sectionId),
      );
      await db.batch([
        db.insert(instructionsTable).values({
          ...instruction,
          position,
          sectionId,
          id: instructionId,
        }),
        db.insert(instructionsTranslations).values(
          translations.map(v => ({
            ...v,
            instructionId,
          })),
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

    return c.json({ id: instructionId }, 201);
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
  verifyRoles(['author', 'admin']),
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
      const [_1, _2, _3, results] = await db.batch([
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
  verifyRoles(['author', 'admin']),
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
