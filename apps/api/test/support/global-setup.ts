import { execSync } from 'node:child_process';
import pg from 'pg';
import { splitDatabaseUrl } from './test-database-url.js';

/** Creates the e2e database when missing and applies all migrations before the tests run. */
export default async function setup(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set by vitest.config.e2e.ts');
  }

  const { name, adminUrl } = splitDatabaseUrl(databaseUrl);
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (!rowCount) {
      await admin.query(`CREATE DATABASE "${name.replaceAll('"', '""')}"`);
    }
  } finally {
    await admin.end();
  }

  // A fixed command string works with npx on both Windows and Linux.
  execSync('npx prisma migrate deploy', { env: process.env, stdio: 'inherit' });
}
