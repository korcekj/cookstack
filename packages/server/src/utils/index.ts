import type { Context } from 'hono';
import type { SQL } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';

import { createHash } from 'crypto';
import { sql, asc, desc, getTableColumns } from 'drizzle-orm';

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

export const getConflictUpdateSetter = <
  T extends SQLiteTable,
  Q extends keyof T['_']['columns']
>(
  table: T,
  columns: Q[]
) => {
  const tableColumns = getTableColumns(table);
  return columns.reduce((acc, column) => {
    const columnName = tableColumns[column].name;
    acc[column] = sql.raw(`excluded.${columnName}`);
    return acc;
  }, {} as Record<Q, SQL>);
};
