import type { SQL } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';

import { sql, asc, desc, getTableColumns } from 'drizzle-orm';

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
