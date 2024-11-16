import { resolve } from 'path';
import { config } from 'dotenv';
import {
  readD1Migrations,
  defineWorkersProject,
} from '@cloudflare/vitest-pool-workers/config';

config({ path: '.dev.vars' });

export default defineWorkersProject(async () => {
  const migrationsPath = resolve(__dirname, './drizzle');
  const migrations = await readD1Migrations(migrationsPath);
  return {
    resolve: {
      alias: {
        '@cs/utils': resolve(__dirname, '../utils/src'),
      },
    },
    test: {
      globals: true,
      setupFiles: ['./test/setup.ts'],
      poolOptions: {
        workers: {
          singleWorker: true,
          isolatedStorage: false,
          wrangler: { configPath: './test/wrangler.toml', environment: 'test' },
          miniflare: {
            bindings: { ...process.env, MIGRATIONS: migrations },
          },
        },
      },
    },
  };
});
