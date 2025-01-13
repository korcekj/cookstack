import type { Env, SentryLevel } from '../types';

import { every } from 'hono/combine';
import { sentry } from '@hono/sentry';
import { createMiddleware } from 'hono/factory';

export const analytics = every(
  createMiddleware<Env>(async (c, next) => {
    const service = sentry({
      environment: c.env.ENV,
      dsn: c.env.ENV !== 'test' ? c.env.SENTRY_DSN : undefined,
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

export const log = (
  category: string,
  message: string,
  level: SentryLevel = 'info',
) =>
  createMiddleware<Env>(async (c, next) => {
    const user = c.get('user');
    const sentry = c.get('sentry');

    sentry.addBreadcrumb({
      category,
      message,
      level,
      data: {
        url: c.req.url,
        method: c.req.method,
        userId: user?.id,
      },
    });

    return next();
  });
