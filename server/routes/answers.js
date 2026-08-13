import { Router } from 'express';
import * as answerRepository from '../repositories/answerRepository.js';

const router = Router();

// POST /api/questions/:questionId/answers — create an answer
router.post('/:questionId/answers', async (req, res, next) => {
  try {
    const { content, authorId, authorName, authorAvatarSeed, isAi } =
      req.body || {};
    if (!content || !authorId) {
      return res.status(400).json({ error: 'content and authorId are required' });
    }
    const answer = await answerRepository.createAnswer({
      questionId: req.params.questionId,
      content,
      authorId,
      authorName,
      authorAvatarSeed,
      isAi,
    });
    res.status(201).json(answer);
  } catch (err) {
    next(err);
  }
});

export default router;
