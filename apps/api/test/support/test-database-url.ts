const TEST_DATABASE_NAME = 'nextzy_test';

/**
 * Returns the connection string used by the e2e tests.
 * Uses TEST_DATABASE_URL when set, otherwise DATABASE_URL with the database renamed to nextzy_test.
 * Refuses any database whose name does not end with "_test", because the tests delete data.
 */
export function resolveTestDatabaseUrl(env: NodeJS.ProcessEnv): string {
  const source = env.TEST_DATABASE_URL?.trim() || env.DATABASE_URL?.trim();
  if (!source) {
    throw new Error('Set TEST_DATABASE_URL or DATABASE_URL to run the e2e tests.');
  }

  const url = new URL(source);
  if (!env.TEST_DATABASE_URL?.trim()) {
    url.pathname = `/${TEST_DATABASE_NAME}`;
  }

  const databaseName = decodeURIComponent(url.pathname.slice(1));
  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing to run e2e tests against "${databaseName}": the database name must end with "_test".`,
    );
  }
  return url.toString();
}

/** Database name and a connection string to the server's maintenance database. */
export function splitDatabaseUrl(databaseUrl: string): { name: string; adminUrl: string } {
  const url = new URL(databaseUrl);
  const name = decodeURIComponent(url.pathname.slice(1));
  url.pathname = '/postgres';
  url.search = '';
  return { name, adminUrl: url.toString() };
}
