import { readEnv } from './env.js';

describe('readEnv', () => {
  const databaseUrl = 'postgresql://user:pass@localhost:5432/db';

  it('returns the parsed configuration', () => {
    expect(readEnv({ DATABASE_URL: databaseUrl, PORT: '3001', NODE_ENV: 'production' })).toEqual({
      databaseUrl,
      port: 3001,
      isProduction: true,
    });
  });

  it('defaults the port to 3000 outside production', () => {
    expect(readEnv({ DATABASE_URL: databaseUrl })).toEqual({
      databaseUrl,
      port: 3000,
      isProduction: false,
    });
  });

  it('throws when DATABASE_URL is missing or blank', () => {
    expect(() => readEnv({})).toThrow('DATABASE_URL is not set');
    expect(() => readEnv({ DATABASE_URL: '  ' })).toThrow('DATABASE_URL is not set');
  });

  it('throws when PORT is not a valid port number', () => {
    expect(() => readEnv({ DATABASE_URL: databaseUrl, PORT: 'abc' })).toThrow('PORT must be');
    expect(() => readEnv({ DATABASE_URL: databaseUrl, PORT: '70000' })).toThrow('PORT must be');
  });
});
