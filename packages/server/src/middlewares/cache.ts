import type { Context } from 'hono';
import type { Env } from '../types';

import { getLocale } from '../utils';
import { createMiddleware } from 'hono/factory';

export const generateKey = (c: Context<Env>) => {
  const url = new URL(c.req.url);
  const locale = getLocale(c);
  const parts = [url.pathname, url.search, locale].filter(Boolean);
  return parts.join(':');
};

export const invalidateKey = async (c: Context<Env>, key: string) => {
  const { keys } = await c.env.KV.list({ prefix: key });
  await Promise.all(keys.map((key) => c.env.KV.delete(key.name)));
};

export const invalidateAll = async (c: Context<Env>) => {
  const { keys } = await c.env.KV.list();
  await Promise.all(keys.map((key) => c.env.KV.delete(key.name)));
};

export const cache = ({
  keyGenerator = generateKey,
  ttl = 3600,
}: {
  keyGenerator?: (c: Context<Env>) => string;
  ttl?: number;
} = {}) =>
  createMiddleware<Env>(async (c, next) => {
    if (c.req.method !== 'GET') return next();

    const key = keyGenerator(c);
    const cached = await c.env.KV.get(key);
    if (cached)
      return c.json(JSON.parse(cached), 200, {
        'Cache-Control': `public, max-age=${ttl}`,
        Vary: 'Accept-Language',
      });

    await next();

    if (c.res && c.res.ok) {
      const value = await c.res.clone().text();
      await c.env.KV.put(key, value, { expirationTtl: ttl });

      return c.res;
    }
  });
