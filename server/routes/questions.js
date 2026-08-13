import { Router } from 'express';
import * as questionRepository from '../repositories/questionRepository.js';

const router = Router();

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
