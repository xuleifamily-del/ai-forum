import crypto from 'crypto';
import { query } from '../db/pool.js';

function mapFeedback(row) {
  if (!row) return null;
  return {
    id: row.id,
    identityId: row.identity_id,
    targetId: row.target_id,
    targetType: row.target_type,
    value: row.value,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

async function createFeedback(data) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const result = await query(
    `INSERT INTO feedback
      (id, identity_id, target_id, target_type, value, comment, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      id,
      data.identityId,
      data.targetId,
      data.targetType,
      data.value,
      data.comment ?? null,
      now,
    ]
  );
  return mapFeedback(result.rows[0]);
}

async function getSummaryFeedbackStats(targetId) {
  const result = await query(
    'SELECT value, COUNT(*)::int AS count FROM feedback WHERE target_id = $1 GROUP BY value',
    [targetId]
  );
  const stats = { helpful: 0, needsUpdate: 0, inaccurate: 0 };
  for (const row of result.rows) {
    if (row.value === 1) stats.helpful = row.count;
    else if (row.value === -1) stats.inaccurate = row.count;
    else if (row.value === 0) stats.needsUpdate = row.count;
  }
  return stats;
}

export { createFeedback, getSummaryFeedbackStats };
