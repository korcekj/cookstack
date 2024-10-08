import type { Context } from 'hono';

import { createHash } from 'node:crypto';

export const getIp = (c: Context) => c.req.header('cf-connecting-ip');

export const getCountry = (c: Context) => c.req.raw.cf?.country as string;

export const getLocale = (c: Context) => {
  const { locale } = c.get('i18n') as unknown as { locale: () => string };
  return locale();
};

export const sha256 = (value: string | Uint8Array) => {
  return createHash('sha256').update(value).digest('hex');
};

export const combineEntries = <T extends [string, unknown][]>(
  entries: T,
  coupler: string = '=',
  delimiter: string = ','
) => {
  return entries
    .map(([key, value]) => `${key}${coupler}${value}`)
    .join(delimiter);
};
