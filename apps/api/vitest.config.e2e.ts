import { defineConfig } from 'vitest/config';
import { loadEnvFile } from './src/config/env.js';
import { resolveTestDatabaseUrl } from './test/support/test-database-url.js';

// e2e tests always run against a dedicated *_test database, never the development one.
loadEnvFile();
process.env.DATABASE_URL = resolveTestDatabaseUrl(process.env);

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/support/global-setup.ts'],
    fileParallelism: false,
  },
});
