import { Router } from 'express';
import * as questionRepository from '../repositories/questionRepository.js';
import * as answerRepository from '../repositories/answerRepository.js';
import { chat, getMockResponse } from '../services/deepseekService.js';
import { buildAnswerMessages } from '../services/aiPromptService.js';

const router = Router();
const inFlight = new Set(); // 防止同一个 questionId 重复生成 AI 回答（内存去重）

// GET /api/questions — list questions
router.get('/', async (req, res, next) => {
  try {
    const { sort, limit, offset, tag } = req.query;
    const result = await questionRepository.listQuestions({
      sort,
      limit,
      offset,
      tag,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/questions/:id — get a single question with answers + summary
router.get('/:id', async (req, res, next) => {
  try {
    const question = await questionRepository.getQuestionById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'question not found' });
    }
    res.json(question);
  } catch (err) {
    next(err);
  }
});

// 异步：发帖完成后自动生成 AI 回答，不阻塞创建问题的响应
async function generateAndSaveAiAnswer(question) {
  if (!question || !question.id) return;
  if (inFlight.has(question.id)) return;
  inFlight.add(question.id);
  try {
    // 先检查是否已有 AI 回答（避免并发/双写重复）
    const existing = await questionRepository.getQuestionById(question.id);
    if (existing && Array.isArray(existing.answers) && existing.answers.some(a => a.isAI)) return;

    const messages = buildAnswerMessages({
      questionId: question.id,
      title: question.title,
      body: question.body,
      topAnswers: [],
    });
    let content = '';
    let mock = false;
    try {
      const result = await chat({
        messages,
        engine: 'answer',
        mockParams: { questionId: question.id, title: question.title, body: question.body },
      });
      content = result.text || '';
      mock = !!result.mock;
    } catch (chatErr) {
      // LLM 失败时走确定性 mock 兜底，标注模拟回复
      content = getMockResponse('answer', { title: question.title, body: question.body });
      mock = true;
    }

    if (!content || !content.trim()) {
      content = getMockResponse('answer', { title: question.title, body: question.body });
      mock = true;
    }

    await answerRepository.createAnswer({
      questionId: question.id,
      authorId: 'ai-system',
      authorName: 'AI 助手',
      authorAvatarSeed: '#5b6cff|#8b5cf6|135',
      content: content.trim(),
      isAi: true,
      aiSourceAnswerIds: [],
    });

    if (mock) {
      console.log(`[ai] Mock AI answer generated for question ${question.id}`);
    } else {
      console.log(`[ai] Real AI answer generated for question ${question.id}`);
    }
  } catch (err) {
    console.error('[ai] Auto-generate AI answer failed:', err?.message || err);
  } finally {
    inFlight.delete(question.id);
  }
}

// POST /api/questions — create a question
router.post('/', async (req, res, next) => {
  try {
    const { title, body, tags, authorId, authorName, authorAvatarSeed, aiAssisted } =
      req.body || {};
    if (!title || !body || !authorId) {
      return res
        .status(400)
        .json({ error: 'title, body and authorId are required' });
    }
    const question = await questionRepository.createQuestion({
      title,
      body,
      tags,
      authorId,
      authorName,
      authorAvatarSeed,
      aiAssisted,
    });
    // 非阻塞：稍后生成 AI 回答并入数据库
    setImmediate(() => generateAndSaveAiAnswer(question));
    res.status(201).json(question);
  } catch (err) {
    next(err);
  }
});

// POST /api/questions/:id/view — increment view count
router.post('/:id/view', async (req, res, next) => {
  try {
    await questionRepository.incrementView(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
