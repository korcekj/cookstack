import type { Env, SentryLevel } from '../types';

import {
  sanitizeUrlSchema,
  sanitizeQuerySchema,
  sanitizeObjectSchema,
} from '@cs/utils/zod';
import { every } from 'hono/combine';
import { sentry } from '@hono/sentry';
import { createMiddleware } from 'hono/factory';
import { getRoute, getBody, getFiles } from '../utils';

export const analytics = every(
  createMiddleware<Env>(async (c, next) => {
    const service = sentry({
      environment: c.env.ENV,
      dsn: c.env.ENV !== 'test' ? c.env.SENTRY_DSN : undefined,
      tracesSampleRate: c.env.ENV === 'production' ? 0.3 : 1.0,
      beforeSend(event) {
        if (event.request) {
          event.request.url = sanitizeUrlSchema.parse({
            url: event.request.url,
            route: getRoute(c),
          });
          event.request.query_string = sanitizeQuerySchema.parse(
            event.request.query_string,
          );
        }

        event.user = sanitizeObjectSchema.parse(event.user ?? {});
        event.breadcrumbs = event.breadcrumbs?.map(b => {
          const { body, files } = b.data ?? {};

          if (body) b.data!.body = sanitizeObjectSchema.parse(body);
          if (files) b.data!.files = sanitizeObjectSchema.parse(files);

          return b;
        });

        return event;
      },
    });
    return service(c, next);
  }),
  createMiddleware<Env>(async (c, next) => {
    const sentry = c.get('sentry');
    const { id: version } = c.env.CF_VERSION_METADATA;

    const url = new URL(
      sanitizeUrlSchema.parse({
        url: c.req.url,
        route: getRoute(c),
      }),
    );

    sentry.setContext('runtime', {
      name: 'Cloudflare Workers',
      version,
    });

    sentry.setTransactionName(`${c.req.method} ${url.pathname}`);

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
    const sentry = c.get('sentry');

    const body = await getBody(c);
    const files = await getFiles(c);

    console.log(files);

    sentry.addBreadcrumb({
      category,
      message,
      level,
      data: {
        body,
        files,
      },
    });

    return next();
  });
