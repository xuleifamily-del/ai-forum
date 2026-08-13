import pg from 'pg';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const databaseUrl = process.env.DATABASE_URL;

let pool = null;
let isDbAvailable = false;

async function query(text, params) {
  if (!pool) {
    throw new Error('Database is not available: DATABASE_URL is not configured.');
  }
  return pool.query(text, params);
}

if (databaseUrl) {
  try {
    pool = new pg.Pool({ connectionString: databaseUrl });
    isDbAvailable = true;
  } catch (err) {
    console.warn('[db] Failed to create connection pool:', err.message);
    pool = null;
    isDbAvailable = false;
  }
} else {
  console.warn(
    '[db] DATABASE_URL is not set. Database features are disabled. ' +
      'Set DATABASE_URL in the environment to enable PostgreSQL.'
  );
}

async function initSchema() {
  if (!pool) {
    throw new Error('Database is not available: DATABASE_URL is not configured.');
  }
  const schemaPath = join(__dirname, 'schema.sql');
  const sql = await readFile(schemaPath, 'utf8');
  await pool.query(sql);
}

export { pool, query, isDbAvailable, initSchema };
