import type { Env } from '../types';

import { useTranslation } from '@intlify/hono';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

export const rateLimit = createMiddleware<Env>(async (c, next) => {
  const t = useTranslation(c);
  const key = c.get('user')?.id ?? c.req.url;

  const { success } = await c.env.RATE_LIMITER.limit({ key });
  if (!success)
    throw new HTTPException(429, { message: t('errors.tooManyRequests') });

  return next();
});
