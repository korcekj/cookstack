import path from 'path';
import { defineConfig } from 'drizzle-kit';

export default process.env.DB_URL
  ? defineConfig({
      schema: './src/db/schema.ts',
      out: './drizzle',
      dialect: 'sqlite',
      dbCredentials: {
        url: path.join('file://', __dirname, process.env.DB_URL),
      },
    })
  : defineConfig({
      schema: './src/db/schema.ts',
      dialect: 'sqlite',
      driver: 'd1-http',
      dbCredentials: {
        accountId: process.env.DB_ACCOUNT_ID!,
        databaseId: process.env.DB_ID!,
        token: process.env.DB_TOKEN!,
      },
    });
