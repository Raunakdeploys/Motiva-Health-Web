import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import * as schema from './schema.ts';

dotenv.config({ path: '.env.development.local' });
dotenv.config();

declare global {
  var _postgresPool: Pool | undefined;
}

export function createPool(): Pool {
  if (!global._postgresPool) {
    if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
      global._postgresPool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        connectionTimeoutMillis: 5000,
        max: 10,
      });
    } else if (process.env.SQL_HOST) {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 5000,
      });
    } else {
      throw new Error('DATABASE_URL is required to use persistent storage.');
    }

    global._postgresPool.on('error', (error) => {
      console.error('Unexpected error on idle PostgreSQL pool client:', error.message);
    });
  }

  return global._postgresPool;
}

export const pool = createPool();
export const db = drizzle(pool, { schema });
