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
} from '../services/aiPromptService.js';

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

// GET /api/ai/health — AI availability (no rate limit)
router.get('/health', (req, res) => {
  res.json({ ai: isAiAvailable(), model: DEEPSEEK_DEFAULT_MODEL });
});

export default router;
