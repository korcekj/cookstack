import type { Context } from 'hono';
import type { Env, CacheMetadata } from '../types';

import { getLocale } from '../utils';
import { createMiddleware } from 'hono/factory';

export const generateKey = (c: Context<Env>) => {
  const url = new URL(c.req.url);
  const locale = getLocale(c);
  const parts = [url.pathname, url.search, locale].filter(Boolean);
  return parts.join(':');
};

export const invalidateKey = async (
  c: Context<Env>,
  key: string,
  prefix?: boolean
) => {
  if (!prefix) await c.env.KV.delete(key);
  else {
    const { keys } = await c.env.KV.list({ prefix: key });
    await Promise.all(keys.map((key) => c.env.KV.delete(key.name)));
  }
};

export const invalidateAll = async (c: Context<Env>) => {
  const { keys } = await c.env.KV.list();
  await Promise.all(keys.map((key) => c.env.KV.delete(key.name)));
};

export const cache = ({
  keyGenerator = generateKey,
  maxAge = 3600,
}: {
  keyGenerator?: (c: Context<Env>) => string;
  maxAge?: number;
} = {}) =>
  createMiddleware<Env>(async (c, next) => {
    if (c.req.method !== 'GET') return next();

    const key = keyGenerator(c);

    try {
      const cached = await c.env.KV.getWithMetadata<CacheMetadata>(key);
      if (cached.value && cached.metadata) {
        return c.newResponse(cached.value, cached.metadata.status, {
          ...cached.metadata.headers,
          'Cache-Control': `public, max-age=${maxAge}`,
          Vary: 'Accept-Language',
        });
      }

      await next();

      if (c.res && c.res.ok) {
        const value = await c.res.clone().text();
        c.executionCtx.waitUntil(
          c.env.KV.put(key, value, {
            expirationTtl: maxAge,
            metadata: {
              status: c.res.status,
              headers: Object.fromEntries(c.res.headers.entries()),
            },
          })
        );
      }

      return c.res;
    } catch (err) {
      console.error(err);
      return next();
    }
  });
