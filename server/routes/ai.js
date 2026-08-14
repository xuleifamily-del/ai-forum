import { Router } from 'express';
import {
  isAiAvailable,
  chat,
  getMockResponse,
  DEEPSEEK_DEFAULT_MODEL,
} from '../services/deepseekService.js';
import {
  buildPolishMessages,
  buildExpandMessages,
  buildDraftMessages,
  buildAnswerMessages,
  buildSummaryMessages,
  buildSearchRewriteMessages,
  buildSearchSummaryMessages,
} from '../services/aiPromptService.js';
import * as feedbackRepository from '../repositories/feedbackRepository.js';
import * as summaryRepository from '../repositories/summaryRepository.js';

const inMemoryFeedback = new Map();

const router = Router();

// --- Simple in-memory IP rate limiter (POST routes only) ---
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20;
const ipBuckets = new Map();

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  return req.ip || 'unknown';
}

function rateLimit(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();

  // Lazy cleanup: sweep expired entries when the map grows to bound memory.
  if (ipBuckets.size > 1000) {
    for (const [key, val] of ipBuckets) {
      if (now > val.resetAt) ipBuckets.delete(key);
    }
  }

  let bucket = ipBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    ipBuckets.set(ip, bucket);
  }
  bucket.count += 1;

  if (bucket.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'rate limit exceeded' });
  }
  next();
}

// POST /api/ai/polish — polish a question title or body
router.post('/polish', rateLimit, async (req, res, next) => {
  const { type, text, context } = req.body || {};
  if (type !== 'title' && type !== 'body') {
    return res.status(400).json({ error: 'invalid type' });
  }
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }
  const engine = type === 'title' ? 'polish-title' : 'polish-body';
  try {
    const messages = buildPolishMessages({ type, text, context });
    const { text: resultText, mock } = await chat({
      messages,
      engine,
      mockParams: { type, text },
    });
    return res.json({ text: resultText, mock });
  } catch (err) {
    console.error('[ai] polish error:', err?.message || err);
    try {
      return res.json({
        text: getMockResponse(engine, { type, text }),
        mock: true,
      });
    } catch {
      return res.json({ text: '', mock: true });
    }
  }
});

// POST /api/ai/expand — expand a question body from title + body
router.post('/expand', rateLimit, async (req, res, next) => {
  const { title, body } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  try {
    const messages = buildExpandMessages({ title, body });
    const { text, mock } = await chat({
      messages,
      engine: 'expand',
      mockParams: { title, body },
    });
    return res.json({ text, mock });
  } catch (err) {
    console.error('[ai] expand error:', err?.message || err);
    try {
      return res.json({
        text: getMockResponse('expand', { title, body }),
        mock: true,
      });
    } catch {
      return res.json({ text: '', mock: true });
    }
  }
});

// POST /api/ai/draft — draft a question or answer
router.post('/draft', rateLimit, async (req, res, next) => {
  const { intent, title, body } = req.body || {};
  if (intent !== 'question' && intent !== 'answer') {
    return res.status(400).json({ error: 'invalid intent' });
  }
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const engine = intent === 'answer' ? 'draft-answer' : 'draft-question';
  try {
    const messages = buildDraftMessages({ intent, title, body });
    const { text, mock } = await chat({
      messages,
      engine,
      mockParams: { intent, title, body },
    });
    return res.json({ text, mock });
  } catch (err) {
    console.error('[ai] draft error:', err?.message || err);
    try {
      return res.json({
        text: getMockResponse(engine, { intent, title, body }),
        mock: true,
      });
    } catch {
      return res.json({ text: '', mock: true });
    }
  }
});

// POST /api/ai/answer — generate an AI answer (SSE or JSON)
router.post('/answer', rateLimit, async (req, res, next) => {
  const { questionId, title, body, topAnswers } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }

  const messages = buildAnswerMessages({ questionId, title, body, topAnswers });
  const mockParams = { questionId, title, body };
  const accept = req.get('Accept') || '';
  const wantsStream = accept.includes('text/event-stream');

  // Non-streaming JSON mode.
  if (!wantsStream) {
    try {
      const { text, mock } = await chat({
        messages,
        engine: 'answer',
        mockParams,
      });
      return res.json({ text, mock });
    } catch (err) {
      console.error('[ai] answer error:', err?.message || err);
      try {
        return res.json({
          text: getMockResponse('answer', mockParams),
          mock: true,
        });
      } catch {
        return res.json({ text: '', mock: true });
      }
    }
  }

  // SSE streaming mode.
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const controller = new AbortController();
  let closed = false;
  const onClose = () => {
    closed = true;
    controller.abort();
  };
  req.on('close', onClose);

  let finalMock = false;
  try {
    const stream = await chat({
      messages,
      stream: true,
      engine: 'answer',
      mockParams,
      signal: controller.signal,
    });
    for await (const chunk of stream) {
      if (closed) break;
      if (chunk.mock) finalMock = true;
      if (chunk.done) break;
      if (chunk.delta) {
        res.write(
          `data: ${JSON.stringify({ delta: chunk.delta, mock: chunk.mock })}\n\n`
        );
      }
    }
    if (!closed && !res.writableEnded) {
      res.write(`data: ${JSON.stringify({ done: true, mock: finalMock })}\n\n`);
    }
  } catch (err) {
    console.error('[ai] answer stream error:', err?.message || err);
    finalMock = true;
    if (!closed && !res.writableEnded) {
      try {
        res.write(`data: ${JSON.stringify({ done: true, mock: finalMock })}\n\n`);
      } catch {
        /* ignore write failure on closed socket */
      }
    }
  } finally {
    req.off('close', onClose);
    if (!res.writableEnded) res.end();
  }
});

// POST /api/ai/search-rewrite — rewrite a search query into standardized terms
router.post('/search-rewrite', rateLimit, async (req, res, next) => {
  const { query } = req.body || {};
  if (typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }
  try {
    const messages = buildSearchRewriteMessages(query.trim());
    const { text, mock } = await chat({
      messages,
      engine: 'search-rewrite',
      mockParams: { query: query.trim(), type: 'rewrite' },
    });
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const trimmed = (text || '').trim();
      const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
      try {
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        parsed = null;
      }
    }
    if (!parsed || typeof parsed.rewritten !== 'string' || !Array.isArray(parsed.keywords)) {
      const fallback = {
        rewritten: query.trim(),
        keywords: query.trim().split(/\s+/).filter(Boolean),
      };
      return res.json({ rewritten: fallback.rewritten, keywords: fallback.keywords, mock: mock || true });
    }
    return res.json({
      rewritten: parsed.rewritten,
      keywords: parsed.keywords,
      mock,
    });
  } catch (err) {
    console.error('[ai] search-rewrite error:', err?.message || err);
    try {
      const mockText = getMockResponse('search-rewrite', { query: query.trim(), type: 'rewrite' });
      let parsed;
      try {
        parsed = JSON.parse(mockText);
      } catch {
        parsed = null;
      }
      if (parsed && typeof parsed.rewritten === 'string' && Array.isArray(parsed.keywords)) {
        return res.json({ rewritten: parsed.rewritten, keywords: parsed.keywords, mock: true });
      }
      const fallback = {
        rewritten: query.trim(),
        keywords: query.trim().split(/\s+/).filter(Boolean),
      };
      return res.json({ rewritten: fallback.rewritten, keywords: fallback.keywords, mock: true });
    } catch {
      const fallback = {
        rewritten: query.trim(),
        keywords: query.trim().split(/\s+/).filter(Boolean),
      };
      return res.json({ rewritten: fallback.rewritten, keywords: fallback.keywords, mock: true });
    }
  }
});

// POST /api/ai/search-summary — generate AI summary for search results
router.post('/search-summary', rateLimit, async (req, res, next) => {
  const { query, rewritten, topQuestions } = req.body || {};
  if (typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }
  if (topQuestions !== undefined && !Array.isArray(topQuestions)) {
    return res.status(400).json({ error: 'topQuestions must be an array' });
  }
  const safeTopQuestions = Array.isArray(topQuestions)
    ? topQuestions.filter(q => q && typeof q === 'object').map(q => ({
        id: q.id,
        title: q.title,
        excerpt: q.excerpt,
        tags: q.tags,
      }))
    : [];
  const mockParams = {
    query: query.trim(),
    rewritten: typeof rewritten === 'string' ? rewritten.trim() : query.trim(),
    topQuestions: safeTopQuestions,
    type: 'search-summary',
  };
  try {
    const messages = buildSearchSummaryMessages({
      query: query.trim(),
      rewritten: typeof rewritten === 'string' ? rewritten.trim() : query.trim(),
      topQuestions: safeTopQuestions,
    });
    const { text, mock } = await chat({
      messages,
      engine: 'search-summary',
      mockParams,
    });
    return res.json({ content: text, mock });
  } catch (err) {
    console.error('[ai] search-summary error:', err?.message || err);
    try {
      return res.json({
        content: getMockResponse('search-summary', mockParams),
        mock: true,
      });
    } catch {
      return res.json({ content: '', mock: true });
    }
  }
});

// POST /api/ai/summary — generate an AI summary from top answers
router.post('/summary', rateLimit, async (req, res, next) => {
  const { questionId, title, body, topAnswers } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (typeof body !== 'string' || !body.trim()) {
    return res.status(400).json({ error: 'body is required' });
  }
  if (topAnswers !== undefined && !Array.isArray(topAnswers)) {
    return res.status(400).json({ error: 'topAnswers must be an array' });
  }
  const safeTopAnswers = Array.isArray(topAnswers) ? topAnswers : [];
  const citations = safeTopAnswers.map((ans, idx) => ({
    index: idx + 1,
    answerId: ans?.id,
  }));
  const mockParams = { title, topAnswers: safeTopAnswers, type: 'summary' };
  try {
    const messages = buildSummaryMessages({ title, body, topAnswers: safeTopAnswers });
    const { text: resultText, mock } = await chat({
      messages,
      engine: 'summary',
      mockParams,
    });
    return res.json({ content: resultText, citations, mock });
  } catch (err) {
    console.error('[ai] summary error:', err?.message || err);
    try {
      return res.json({
        content: getMockResponse('summary', mockParams),
        citations,
        mock: true,
      });
    } catch {
      return res.json({ content: '', citations, mock: true });
    }
  }
});

// POST /api/ai/summary/feedback — record feedback for a summary
router.post('/summary/feedback', rateLimit, async (req, res, next) => {
  const { questionId, summaryId, type, comment } = req.body || {};
  const validTypes = ['helpful', 'needsUpdate', 'inaccurate'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'invalid type' });
  }

  let feedbackCount = 0;
  let statusResult = null;

  try {
    const valueMap = { helpful: 1, needsUpdate: 0, inaccurate: -1 };
    try {
      await feedbackRepository.createFeedback({
        identityId: 'anonymous',
        targetId: summaryId || questionId,
        targetType: 'SUMMARY',
        value: valueMap[type],
        comment,
      });
    } catch (dbErr) {
      const key = summaryId || questionId || 'default';
      const existing = inMemoryFeedback.get(key) || { helpful: 0, needsUpdate: 0, inaccurate: 0 };
      existing[type] = (existing[type] || 0) + 1;
      inMemoryFeedback.set(key, existing);
    }

    if (summaryId) {
      try {
        const result = await summaryRepository.recordFeedback({ summaryId, type, comment });
        feedbackCount = result.feedbackCount;
        statusResult = result.status;
      } catch {
        const key = summaryId;
        const existing = inMemoryFeedback.get(key) || { helpful: 0, needsUpdate: 0, inaccurate: 0 };
        feedbackCount = existing.helpful + existing.needsUpdate + existing.inaccurate;
      }
    } else {
      const key = questionId || 'default';
      const existing = inMemoryFeedback.get(key) || { helpful: 0, needsUpdate: 0, inaccurate: 0 };
      feedbackCount = existing.helpful + existing.needsUpdate + existing.inaccurate;
    }

    return res.json({ ok: true, feedbackCount, status: statusResult });
  } catch (err) {
    console.error('[ai] summary feedback error:', err?.message || err);
    return res.json({ ok: true, feedbackCount: 0 });
  }
});

// GET /api/ai/health — AI availability (no rate limit)
router.get('/health', (req, res) => {
  res.json({ ai: isAiAvailable(), model: DEEPSEEK_DEFAULT_MODEL });
});

export default router;
