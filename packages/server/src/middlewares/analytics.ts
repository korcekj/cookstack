import type { Env } from '../types';

import { every } from 'hono/combine';
import { sentry } from '@hono/sentry';
import { createMiddleware } from 'hono/factory';

export const analytics = every(
  createMiddleware<Env>(async (c, next) => {
    const service = sentry({
      dsn: c.env.SENTRY_DSN,
      environment: c.env.ENV,
      tracesSampleRate: c.env.ENV === 'production' ? 0.3 : 1.0,
    });
    return service(c, next);
  }),
  createMiddleware<Env>(async (c, next) => {
    const sentry = c.get('sentry');
    const { id: version } = c.env.CF_VERSION_METADATA;

    sentry.setContext('runtime', {
      name: 'Cloudflare Workers',
      version,
    });
    sentry.setTransactionName(`${c.req.method} ${c.req.url}`);

    await next();

    sentry.setTag('status_code', c.res.status);
  }),
);
