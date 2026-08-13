import crypto from 'crypto';
import { query } from '../db/pool.js';

async function createUser(username, passwordHash) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const result = await query(
    `INSERT INTO users (id, username, password_hash, created_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, username, passwordHash, now]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at,
  };
}

async function getUserByUsername(username) {
  const result = await query('SELECT * FROM users WHERE username = $1', [
    username,
  ]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

async function getUserById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    username: row.username,
    createdAt: row.created_at,
  };
}

export { createUser, getUserByUsername, getUserById };
