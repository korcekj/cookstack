import type { Context } from 'hono';

import { objectEntries, fileToObject } from '@cs/utils';

export const getIp = (c: Context) => c.req.header('cf-connecting-ip');

export const getCountry = (c: Context) => c.req.raw.cf?.country as string;

export const getBody = async (c: Context) => {
  if (!['POST', 'PUT', 'PATCH'].includes(c.req.method)) return undefined;
  if (!c.req.header('content-type')?.includes('application/json')) {
    return undefined;
  }

  try {
    return (await c.req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
};

export const getFiles = async (c: Context) => {
  if (!['POST', 'PUT', 'PATCH'].includes(c.req.method)) return undefined;
  if (!c.req.header('content-type')?.includes('multipart/form-data')) {
    return undefined;
  }

  try {
    const body = await c.req.parseBody();
    return objectEntries(body).reduce(
      (acc, [key, value]) => {
        if (value instanceof File) acc[key] = fileToObject(value);
        return acc;
      },
      {} as Record<string, ReturnType<typeof fileToObject>>,
    );
  } catch {
    return {};
  }
};

export const getRoute = (c: Context) => {
  const { length: segments } = c.req.path.split('/');
  const routes = c.req.matchedRoutes.filter(({ handler }) => !handler.name);

  const route = routes[c.req.routeIndex];
  if (segments === route?.path.split('/').length) {
    return route.path;
  }

  return routes.find(r => r.path.split('/').length === segments)?.path;
};
