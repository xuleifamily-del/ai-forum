import crypto from 'crypto';
import { query } from '../db/pool.js';
import cacheService from '../services/cacheService.js';

function mapQuestion(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    titleRaw: row.title_raw,
    body: row.body,
    tags: row.tags || [],
    authorId: row.author_id,
    authorName: row.author_name,
    authorAvatarSeed: row.author_avatar_seed,
    status: row.status,
    aiAssisted: row.ai_assisted,
    relatedQuestionIds: row.related_question_ids || [],
    viewCount: row.view_count,
    answerCount: row.answer_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listQuestions({ sort = 'latest', limit = 20, offset = 0, tag } = {}) {
  const numericLimit = Number(limit) || 20;
  const numericOffset = Number(offset) || 0;

  const cacheKey = `qlist:${sort}:${tag || 'all'}:${numericLimit}:${numericOffset}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const whereClause = tag ? 'WHERE $1 = ANY(tags)' : '';
  const params = tag ? [tag] : [];

  let orderBy = 'ORDER BY created_at DESC';
  if (sort === 'hot') {
    orderBy = 'ORDER BY view_count DESC, answer_count DESC';
  }

  const countSql = `SELECT COUNT(*)::int AS total FROM questions ${whereClause}`;
  const countResult = await query(countSql, params);
  const total = countResult.rows[0]?.total || 0;

  const listSql = `SELECT * FROM questions ${whereClause} ${orderBy} LIMIT $${
    tag ? '2' : '1'
  } OFFSET $${tag ? '3' : '2'}`;
  const listParams = tag
    ? [tag, numericLimit, numericOffset]
    : [numericLimit, numericOffset];

  const listResult = await query(listSql, listParams);
  const items = listResult.rows.map(mapQuestion);
  const result = { items, total };
  await cacheService.set(cacheKey, result, 60);
  return result;
}

async function getQuestionById(id) {
  const cacheKey = `q:${id}`;
  const cached = await cacheService.get(cacheKey);
  if (cached !== null) return cached;

  const qResult = await query('SELECT * FROM questions WHERE id = $1', [id]);
  if (qResult.rows.length === 0) {
    // Cache null result with short TTL to prevent cache penetration.
    await cacheService.set(cacheKey, null, 30);
    return null;
  }
  const question = mapQuestion(qResult.rows[0]);

  const answersResult = await query(
    'SELECT * FROM answers WHERE question_id = $1 ORDER BY is_ai DESC, created_at ASC',
    [id]
  );
  question.answers = answersResult.rows.map((row) => ({
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
  }));

  const summaryResult = await query(
    'SELECT * FROM ai_summaries WHERE question_id = $1 LIMIT 1',
    [id]
  );
  if (summaryResult.rows.length > 0) {
    const s = summaryResult.rows[0];
    question.aiSummary = {
      id: s.id,
      questionId: s.question_id,
      content: s.content,
      sourceAnswerIds: s.source_answer_ids || [],
      citations: s.citations || [],
      status: s.status,
      generatedAt: s.generated_at,
      updatedAt: s.updated_at,
      feedbackCount: s.feedback_count || { helpful: 0, needsUpdate: 0, inaccurate: 0 },
    };
  } else {
    question.aiSummary = null;
  }

  await cacheService.set(cacheKey, question, 300);
  return question;
}

async function createQuestion(data) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const result = await query(
    `INSERT INTO questions
      (id, title, title_raw, body, tags, author_id, author_name, author_avatar_seed,
       status, ai_assisted, related_question_ids, view_count, answer_count,
       created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      id,
      data.title,
      data.title,
      data.body,
      data.tags || [],
      data.authorId,
      data.authorName,
      data.authorAvatarSeed,
      'open',
      data.aiAssisted || false,
      [],
      0,
      0,
      now,
      now,
    ]
  );
  const question = mapQuestion(result.rows[0]);
  await cacheService.delByPattern('qlist:*');
  return question;
}

async function incrementView(id) {
  await query('UPDATE questions SET view_count = view_count + 1 WHERE id = $1', [id]);
}

export { listQuestions, getQuestionById, createQuestion, incrementView };
