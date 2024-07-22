import type { Context } from 'hono';

export const getIp = (c: Context) => c.req.header('cf-connecting-ip');

export const getCountry = (c: Context) => c.req.raw.cf?.country as string;

export const getLocale = (c: Context) => {
  const { locale } = c.get('i18n') as unknown as { locale: () => string };
  return locale();
};
