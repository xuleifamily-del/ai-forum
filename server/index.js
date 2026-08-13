import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import crypto from 'crypto';
import {
  isDbAvailable,
  verifyConnection,
  initSchema,
  query as dbQuery,
  pool,
} from './db/pool.js';
import { isRedisAvailable } from './db/redis.js';
import questionsRouter from './routes/questions.js';
import answersRouter from './routes/answers.js';
import summariesRouter from './routes/summaries.js';
import feedbackRouter from './routes/feedback.js';
import authRouter from './routes/auth.js';
import {
  seedQuestions,
  seedAnswers,
  seedSummaries,
} from '../src/seed/forumSeedData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: '2mb' }));

// Health check (always available, reflects DB + Redis state).
app.get('/api/health', (req, res) => {
  const status = isDbAvailable && isRedisAvailable ? 'ok' : 'degraded';
  res.json({ status, db: isDbAvailable, redis: isRedisAvailable });
});

app.use('/api/auth', authRouter);

// When the database is unavailable, reject all other /api data routes with 503.
app.use('/api', (req, res, next) => {
  if (!isDbAvailable) {
    return res.status(503).json({ error: 'database unavailable' });
  }
  next();
});

// API routes.
app.use('/api/questions', questionsRouter);
// answers & summaries are nested under /api/questions/:questionId/...
app.use('/api/questions', answersRouter);
app.use('/api/questions', summariesRouter);
app.use('/api/feedback', feedbackRouter);

// Production: serve the built SPA from dist/.
const isDev = process.env.NODE_ENV === 'development';
if (!isDev) {
  const distPath = path.resolve(__dirname, '../dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
  }
  // SPA catch-all: any non-/api GET serves index.html.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (existsSync(indexHtmlPath)) {
      return res.sendFile(indexHtmlPath);
    }
    res.status(404).send('Not found');
  });
}

// Centralized error handler.
app.use((err, req, res, next) => {
  console.error('[server] Error:', err.message);
  if (
    err.message?.includes('connect') ||
    err.message?.includes('timeout') ||
    err.message?.includes('relation') ||
    err.code === '42P01'
  ) {
    return res.status(503).json({ error: 'database unavailable' });
  }
  res.status(500).json({ error: 'internal server error' });
});

const AUTHOR_A = 'aaaaaaaa-aaaa-4000-8000-000000000001';
const AUTHOR_B = 'bbbbbbbb-bbbb-4000-8000-000000000002';
const AUTHOR_C = 'cccccccc-cccc-4000-8000-000000000003';
const AUTHOR_D = 'dddddddd-dddd-4000-8000-000000000004';
const AUTHOR_AI = 'ai-system';

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

async function autoSeed() {
  const existing = await dbQuery('SELECT COUNT(*)::int AS c FROM questions');
  if (existing.rows[0]?.c > 0) {
    console.log('[server] Database already has data, skipping seed.');
    return;
  }

  let qCount = 0;
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
    qCount += result.rowCount;
  }

  let aCount = 0;
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
    aCount += result.rowCount;
  }

  let sCount = 0;
  for (const s of seedSummaries) {
    const result = await pool.query(
      `INSERT INTO ai_summaries
        (id, question_id, content, source_answer_ids, citations, status,
         generated_at, updated_at, feedback_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO NOTHING`,
      [
        crypto.randomUUID(),
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
    sCount += result.rowCount;
  }

  console.log(
    `[server] Seeded: questions=${qCount}, answers=${aCount}, summaries=${sCount}`
  );
}

const PORT = process.env.PORT || 5175;

if (process.env.NODE_ENV !== 'test') {
  (async () => {
    if (process.env.DATABASE_URL) {
      const ok = await verifyConnection();
      if (ok) {
        console.log('[server] Database connection verified successfully.');
        try {
          await initSchema();
          console.log('[server] Database schema initialized.');
          try {
            await autoSeed();
          } catch (seedErr) {
            console.warn('[server] Seed warning (non-fatal):', seedErr.message);
          }
        } catch (schemaErr) {
          console.error('[server] Schema init failed:', schemaErr.message);
        }
      } else {
        console.warn('[server] Database connection verification failed. Starting in degraded mode.');
      }
    }

    app.listen(PORT, () => {
      console.log(
        `[server] ai-forum API listening on http://localhost:${PORT} ` +
          `(db: ${isDbAvailable ? 'connected' : 'unavailable/degraded'}, ` +
          `redis: ${isRedisAvailable ? 'connected' : 'unavailable/caching-disabled'})`
      );
    });
  })();
}

export default app;
