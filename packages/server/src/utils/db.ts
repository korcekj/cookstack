import type { SQL } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { User, RecipeStatus, GetRecipesInput } from '@cs/utils/zod';

import { sql, asc, desc, getTableColumns } from 'drizzle-orm';

export const getRecipesWhereClauses = (
  user: User | null,
  options: GetRecipesInput,
): Partial<{ status: RecipeStatus; userId: string }>[] => {
  if (!user || user.role === 'user') return [{ status: 'published' }];
  else if (user.role === 'author') {
    if (!('userId' in options)) {
      return 'status' in options
        ? options.status === 'draft'
          ? [{ status: 'draft', userId: user.id }]
          : [{ status: 'published' }]
        : [{ status: 'published' }, { status: 'draft', userId: user.id }];
    } else if ('userId' in options && user.id !== options.userId) {
      return [{ status: 'published' }];
    } else return [{ status: options.status }];
  } else if (user.role === 'admin') return [{ status: options.status }];
  else return [];
};

export const getOrderByClauses = <T extends string>(
  orderBy: string | null | undefined,
  getter: (v: T) => SQLiteColumn | SQL,
) => {
  return (
    orderBy?.split(',').map(v => {
      const isAsc = !v.startsWith('-');
      const columnName = (v.startsWith('-') ? v.slice(1) : v) as T;
      const column = getter(columnName);
      return isAsc ? asc(column) : desc(column);
    }) ?? []
  );
};

export const getConflictUpdateSetter = <
  T extends SQLiteTable,
  Q extends keyof T['_']['columns'],
>(
  table: T,
  columns: Q[],
) => {
  const tableColumns = getTableColumns(table);
  return columns.reduce(
    (acc, column) => {
      const columnName = tableColumns[column].name;
      acc[column] = sql.raw(`excluded.${columnName}`);
      return acc;
    },
    {} as Record<Q, SQL>,
  );
};
