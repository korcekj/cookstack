import * as schema from './schema';
import { drizzle } from 'drizzle-orm/d1';

export const initializeDB = (D1: D1Database) => {
  return drizzle(D1, { schema });
};
