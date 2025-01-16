import type { Context } from 'hono';
import type { Env } from '../types';
import type { Duration } from '@upstash/ratelimit';

import { getIp, getCountry } from '../utils';
import { Ratelimit } from '@upstash/ratelimit';
import { createMiddleware } from 'hono/factory';
import { Redis } from '@upstash/redis/cloudflare';
import { HTTPException } from 'hono/http-exception';

const cache = new Map<string, number>();

const identifier = (c: Context<Env>) => {
  const ip = getIp(c);
  const user = c.get('user');
  const url = new URL(c.req.url);
  return user?.id ?? `${ip ?? 'global'}:${url.pathname}${url.search}`;
};

export const rateLimiter = (tokens: number, duration: Duration) =>
  createMiddleware<Env>(async (c, next) => {
    if (c.env.ENV !== 'production') return next();

    const key = identifier(c);
    const { t } = c.get('i18n');
    const sentry = c.get('sentry');

    const redis = Redis.fromEnv(c.env);
    const limiter = new Ratelimit({
      redis,
      ephemeralCache: cache,
      limiter: Ratelimit.slidingWindow(tokens, duration),
    });

    const ip = getIp(c);
    const country = getCountry(c);
    const { success } = await limiter.limit(key, { ip, country });

    if (!success) {
      sentry.addBreadcrumb({
        category: 'Rate limit',
        message: 'Rate limit exceeded',
        level: 'warning',
        data: {
          ip,
          country,
          identifier: key,
        },
      });
      throw new HTTPException(429, { message: t('errors.tooManyRequests') });
    }

    return next();
  });

export default rateLimiter(10, '10 s');
