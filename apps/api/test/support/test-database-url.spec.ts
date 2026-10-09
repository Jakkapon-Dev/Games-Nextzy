import { resolveTestDatabaseUrl, splitDatabaseUrl } from './test-database-url.js';

describe('resolveTestDatabaseUrl', () => {
  it('renames the database in DATABASE_URL to nextzy_test', () => {
    const url = resolveTestDatabaseUrl({
      DATABASE_URL: 'postgresql://user:p%40ss@localhost:5432/nextzy_dev?schema=public',
    });
    expect(url).toBe('postgresql://user:p%40ss@localhost:5432/nextzy_test?schema=public');
  });

  it('uses TEST_DATABASE_URL as is when it is set', () => {
    const url = resolveTestDatabaseUrl({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/nextzy_dev',
      TEST_DATABASE_URL: 'postgresql://user:pass@db:5432/custom_test',
    });
    expect(url).toBe('postgresql://user:pass@db:5432/custom_test');
  });

  it('refuses a database whose name does not end with _test', () => {
    expect(() =>
      resolveTestDatabaseUrl({ TEST_DATABASE_URL: 'postgresql://user:pass@localhost/nextzy_dev' }),
    ).toThrow('must end with "_test"');
  });

  it('throws when no connection string is configured', () => {
    expect(() => resolveTestDatabaseUrl({})).toThrow('TEST_DATABASE_URL or DATABASE_URL');
  });
});

describe('splitDatabaseUrl', () => {
  it('returns the database name and a URL to the maintenance database', () => {
    expect(splitDatabaseUrl('postgresql://u:p@localhost:5432/nextzy_test?schema=public')).toEqual({
      name: 'nextzy_test',
      adminUrl: 'postgresql://u:p@localhost:5432/postgres',
    });
  });
});
