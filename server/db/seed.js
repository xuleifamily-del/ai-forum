import crypto from 'crypto';
import { initSchema, pool } from './pool.js';
import { seedQuestions, seedAnswers, seedSummaries } from '../../src/seed/forumSeedData.js';

const AUTHOR_A = 'aaaaaaaa-aaaa-4000-8000-000000000001';
const AUTHOR_B = 'bbbbbbbb-bbbb-4000-8000-000000000002';
const AUTHOR_C = 'cccccccc-cccc-4000-8000-000000000003';
const AUTHOR_D = 'dddddddd-dddd-4000-8000-000000000004';
const AUTHOR_AI = 'ai-system';

// Seed author display info (nickname + avatar seed matching the project's
// "{color1}|{color2}|{angle}" avatar seed format).
const authorInfo = {
  [AUTHOR_A]: { authorName: '游客#A001', authorAvatarSeed: '#5b6cff|#14b585|135' },
  [AUTHOR_B]: { authorName: '游客#B002', authorAvatarSeed: '#14b585|#f59e0b|90' },
  [AUTHOR_C]: { authorName: '游客#C003', authorAvatarSeed: '#f59e0b|#ef4444|45' },
  [AUTHOR_D]: { authorName: '游客#D004', authorAvatarSeed: '#ef4444|#8b5cf6|180' },
  [AUTHOR_AI]: { authorName: 'AI 助手', authorAvatarSeed: '#5b6cff|#8b5cf6|135' },
};

function authorOf(authorId) {
  return (
    authorInfo[authorId] || {
      authorName: '游客#????',
      authorAvatarSeed: '#5b6cff|#14b585|135',
    }
  );
}

async function seedQuestionsTable() {
  let inserted = 0;
  for (const q of seedQuestions) {
    const a = authorOf(q.authorId);
    const result = await pool.query(
      `INSERT INTO questions
        (id, title, title_raw, body, tags, author_id, author_name, author_avatar_seed,
         status, ai_assisted, related_question_ids, view_count, answer_count,
         created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (id) DO NOTHING`,
      [
        q.id,
        q.title,
        q.titleRaw,
        q.body,
        q.tags || [],
        q.authorId,
        a.authorName,
        a.authorAvatarSeed,
        q.status || 'open',
        q.aiAssisted || false,
        q.relatedQuestionIds || [],
        q.viewCount || 0,
        q.answerCount || 0,
        q.createdAt,
        q.updatedAt,
      ]
    );
    inserted += result.rowCount;
  }
  return inserted;
}

async function seedAnswersTable() {
  let inserted = 0;
  for (const ans of seedAnswers) {
    const a = authorOf(ans.authorId);
    const result = await pool.query(
      `INSERT INTO answers
        (id, question_id, author_id, author_name, author_avatar_seed, content,
         is_ai, ai_source_answer_ids, upvotes, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id) DO NOTHING`,
      [
        ans.id,
        ans.questionId,
        ans.authorId,
        a.authorName,
        a.authorAvatarSeed,
        ans.content,
        ans.isAI || false,
        ans.aiSourceAnswerIds || [],
        ans.upvotes || 0,
        ans.status || 'published',
        ans.createdAt,
        ans.updatedAt,
      ]
    );
    inserted += result.rowCount;
  }
  return inserted;
}

async function seedSummariesTable() {
  // Summaries use a freshly generated UUID id per the task spec. To keep the
  // seed idempotent, first clear any existing summaries for the seed question
  // ids, then insert fresh rows.
  const questionIds = seedSummaries.map((s) => s.questionId);
  if (questionIds.length > 0) {
    await pool.query('DELETE FROM ai_summaries WHERE question_id = ANY($1)', [questionIds]);
  }

  let inserted = 0;
  for (const s of seedSummaries) {
    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO ai_summaries
        (id, question_id, content, source_answer_ids, citations, status,
         generated_at, updated_at, feedback_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO NOTHING`,
      [
        id,
        s.questionId,
        s.content,
        s.sourceAnswerIds || [],
        JSON.stringify(s.citations || []),
        s.status || 'stable',
        s.generatedAt,
        s.updatedAt,
        JSON.stringify(
          s.feedbackCount || { helpful: 0, needsUpdate: 0, inaccurate: 0 }
        ),
      ]
    );
    inserted += result.rowCount;
  }
  return inserted;
}

async function main() {
  if (!pool) {
    console.warn(
      '[seed] DATABASE_URL is not set. Nothing to seed. Exiting.'
    );
    return;
  }

  console.log('[seed] Initializing schema...');
  await initSchema();

  console.log('[seed] Inserting questions...');
  const qCount = await seedQuestionsTable();

  console.log('[seed] Inserting answers...');
  const aCount = await seedAnswersTable();

  console.log('[seed] Inserting summaries...');
  const sCount = await seedSummariesTable();

  console.log(
    `[seed] Done. questions inserted/updated: ${qCount}, ` +
      `answers: ${aCount}, summaries: ${sCount}`
  );
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (pool) {
      try {
        await pool.end();
      } catch {
        /* ignore */
      }
    }
  });
