import type { SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

import * as schema from './schema';
import { asc, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';

export const initializeDB = (D1: D1Database) => {
  return drizzle(D1, { schema });
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
