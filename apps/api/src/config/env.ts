import { existsSync } from 'node:fs';

export interface Env {
  databaseUrl: string;
  port: number;
  isProduction: boolean;
}

/** Loads variables from a .env file into process.env when the file exists. */
export function loadEnvFile(path = '.env'): void {
  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}

/** Reads and validates the variables the API needs. Throws on invalid configuration. */
export function readEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const databaseUrl = source.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Copy apps/api/.env.example to apps/api/.env.');
  }

  const port = Number(source.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535, got "${source.PORT}".`);
  }

  return { databaseUrl, port, isProduction: source.NODE_ENV === 'production' };
}
