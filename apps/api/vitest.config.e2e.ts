import { defineConfig } from 'vitest/config';
import { loadEnvFile } from './src/config/env.js';

loadEnvFile();

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
  },
});
