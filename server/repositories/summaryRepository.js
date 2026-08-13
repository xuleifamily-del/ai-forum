import crypto from 'crypto';
import { query } from '../db/pool.js';

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

async function getByQuestion(questionId) {
  const result = await query(
    'SELECT * FROM ai_summaries WHERE question_id = $1 LIMIT 1',
    [questionId]
  );
  if (result.rows.length === 0) return null;
  return mapSummary(result.rows[0]);
}

async function upsertSummary(data) {
  const existing = await getByQuestion(data.questionId);
  const now = Date.now();

  if (existing) {
    const result = await query(
      `UPDATE ai_summaries
       SET content = $1,
           source_answer_ids = $2,
           citations = $3,
           status = $4,
           updated_at = $5
       WHERE id = $6
       RETURNING *`,
      [
        data.content,
        data.sourceAnswerIds || [],
        JSON.stringify(data.citations || []),
        data.status || 'stable',
        now,
        existing.id,
      ]
    );
    return mapSummary(result.rows[0]);
  }

  const id = crypto.randomUUID();
  const result = await query(
    `INSERT INTO ai_summaries
      (id, question_id, content, source_answer_ids, citations, status,
       generated_at, updated_at, feedback_count)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      id,
      data.questionId,
      data.content,
      data.sourceAnswerIds || [],
      JSON.stringify(data.citations || []),
      data.status || 'stable',
      now,
      now,
      JSON.stringify({ helpful: 0, needsUpdate: 0, inaccurate: 0 }),
    ]
  );
  return mapSummary(result.rows[0]);
}

export { getByQuestion, upsertSummary };
