import type { z } from '@cs/utils/zod';
import type { ValidationTargets } from 'hono';

import { zValidator } from '@hono/zod-validator';
import { parseError } from '@cs/utils/zod';

export const validator = <T extends z.ZodType<any, z.ZodTypeDef, any>>(
  target: keyof ValidationTargets,
  schema: T
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const error = parseError(result.error);
      return c.json({ error }, 400);
    }
  });
