import crypto from 'crypto';
import { query } from '../db/pool.js';
import cacheService from '../services/cacheService.js';

function mapSummary(row) {
  if (!row) return null;
  return {
    id: row.id,
    questionId: row.question_id,
    content: row.content,
    sourceAnswerIds: row.source_answer_ids || [],
    citations: row.citations || [],
    status: row.status,
    generatedAt: row.generated_at,
    updatedAt: row.updated_at,
    feedbackCount: row.feedback_count || { helpful: 0, needsUpdate: 0, inaccurate: 0 },
  };
}

async function getByQuestionId(questionId) {
  const result = await query(
    'SELECT * FROM ai_summaries WHERE question_id = $1 LIMIT 1',
    [questionId]
  );
  if (result.rows.length === 0) return null;
  return mapSummary(result.rows[0]);
}

async function getByQuestion(questionId) {
  return getByQuestionId(questionId);
}

async function upsertSummary(data) {
  const now = Date.now();
  const id = crypto.randomUUID();
  const status = data.status || 'stable';
  const defaultFeedback = { helpful: 0, needsUpdate: 0, inaccurate: 0 };

  const result = await query(
    `INSERT INTO ai_summaries
      (id, question_id, content, source_answer_ids, citations, status,
       generated_at, updated_at, feedback_count)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (question_id) DO UPDATE SET
       content = EXCLUDED.content,
       source_answer_ids = EXCLUDED.source_answer_ids,
       citations = EXCLUDED.citations,
       status = EXCLUDED.status,
       updated_at = EXCLUDED.updated_at
     RETURNING *`,
    [
      id,
      data.questionId,
      data.content,
      data.sourceAnswerIds || [],
      JSON.stringify(data.citations || []),
      status,
      now,
      now,
      JSON.stringify(defaultFeedback),
    ]
  );
  const summary = mapSummary(result.rows[0]);
  await cacheService.del(`q:${data.questionId}`);
  return summary;
}

async function recordFeedback({ summaryId, type, comment }) {
  const validTypes = ['helpful', 'needsUpdate', 'inaccurate'];
  if (!validTypes.includes(type)) {
    throw new Error(`invalid feedback type: ${type}`);
  }

  const current = await query(
    'SELECT feedback_count, status FROM ai_summaries WHERE id = $1 FOR UPDATE',
    [summaryId]
  );
  if (current.rows.length === 0) {
    throw new Error(`summary not found: ${summaryId}`);
  }

  const oldCount = current.rows[0].feedback_count || { helpful: 0, needsUpdate: 0, inaccurate: 0 };
  const newCount = { ...oldCount };
  newCount[type] = (oldCount[type] || 0) + 1;

  let newStatus = current.rows[0].status;
  if (type === 'needsUpdate') {
    newStatus = 'outdated';
  }

  const totalCount = newCount.helpful + newCount.needsUpdate + newCount.inaccurate;

  const result = await query(
    `UPDATE ai_summaries
     SET feedback_count = $1,
         status = $2,
         updated_at = $3
     WHERE id = $4
     RETURNING *`,
    [JSON.stringify(newCount), newStatus, Date.now(), summaryId]
  );

  return {
    feedbackCount: totalCount,
    status: result.rows[0]?.status || newStatus,
  };
}

export { getByQuestionId, getByQuestion, upsertSummary, recordFeedback };
