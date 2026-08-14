import crypto from 'crypto';
import { query } from '../db/pool.js';
import cacheService from '../services/cacheService.js';

function mapAnswer(row) {
  if (!row) return null;
  return {
    id: row.id,
    questionId: row.question_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorAvatarSeed: row.author_avatar_seed,
    content: row.content,
    isAI: row.is_ai,
    aiSourceAnswerIds: row.ai_source_answer_ids || [],
    upvotes: row.upvotes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listByQuestion(questionId) {
  const result = await query(
    'SELECT * FROM answers WHERE question_id = $1 ORDER BY is_ai DESC, created_at ASC',
    [questionId]
  );
  return result.rows.map(mapAnswer);
}

async function createAnswer(data) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const result = await query(
    `INSERT INTO answers
      (id, question_id, author_id, author_name, author_avatar_seed, content,
       is_ai, ai_source_answer_ids, upvotes, status, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      id,
      data.questionId,
      data.authorId,
      data.authorName,
      data.authorAvatarSeed,
      data.content,
      data.isAi || false,
      [],
      0,
      'published',
      now,
      now,
    ]
  );
  await query(
    'UPDATE questions SET answer_count = answer_count + 1 WHERE id = $1',
    [data.questionId]
  );
  await cacheService.del(`q:${data.questionId}`);
  return mapAnswer(result.rows[0]);
}

async function incrementUpvote(id) {
  await query('UPDATE answers SET upvotes = upvotes + 1 WHERE id = $1', [id]);
}

async function toggleUpvote(questionId, answerId, direction = 'up') {
  const isDown = direction === 'down';
  const setClause = isDown
    ? 'upvotes = GREATEST(upvotes - 1, 0)'
    : 'upvotes = upvotes + 1';
  const result = await query(
    `UPDATE answers SET ${setClause}
     WHERE id = $1 AND question_id = $2
     RETURNING id, question_id, upvotes`,
    [answerId, questionId]
  );
  if (result.rows.length === 0) {
    return null;
  }
  const row = result.rows[0];
  return {
    id: row.id,
    questionId: row.question_id,
    upvotes: row.upvotes,
    upvoted: !isDown,
  };
}

export { listByQuestion, createAnswer, incrementUpvote, toggleUpvote };
