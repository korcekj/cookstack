import type { Context } from 'hono';
import type { SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

import { asc, desc } from 'drizzle-orm';

export const getIp = (c: Context) => c.req.header('cf-connecting-ip');

export const getCountry = (c: Context) => c.req.raw.cf?.country as string;

export const getLocale = (c: Context) => {
  const { locale } = c.get('i18n') as unknown as { locale: () => string };
  return locale();
};

export const getOrderByClauses = <T extends string>(
  orderBy: string | undefined,
  getter: (v: T) => SQLiteColumn | SQL
) => {
  return (
    orderBy?.split(',').map((v) => {
      const isAsc = v.startsWith('-') ? false : true;
      const columnName = (v.startsWith('-') ? v.slice(1) : v) as T;
      const column = getter(columnName);
      return isAsc ? asc(column) : desc(column);
    }) ?? []
  );
};
