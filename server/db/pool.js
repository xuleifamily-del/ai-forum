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
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (
      err.message?.includes('connect') ||
      err.message?.includes('timeout') ||
      err.code === 'ECONNREFUSED' ||
      err.code === 'ENOTFOUND' ||
      err.code === 'ETIMEDOUT'
    ) {
      isDbAvailable = false;
      console.warn('[db] Connection failed, marking database as unavailable:', err.message);
    }
    throw err;
  }
}

async function verifyConnection() {
  if (!pool) return false;
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.warn('[db] Connection verification failed:', err.message);
    try {
      await pool.end();
    } catch {
      /* ignore */
    }
    pool = null;
    return false;
  }
}

if (databaseUrl) {
  try {
    pool = new pg.Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10,
    });

    pool.on('error', (err) => {
      console.warn('[db] Pool error:', err.message);
      isDbAvailable = false;
    });

    pool.on('connect', () => {
      isDbAvailable = true;
    });
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

export { pool, query, isDbAvailable, verifyConnection, initSchema };
