import { Router } from 'express';
import * as answerRepository from '../repositories/answerRepository.js';

const router = Router();

// POST /api/questions/:questionId/answers — create an answer
router.post('/:questionId/answers', async (req, res, next) => {
  try {
    const { content, authorId, authorName, authorAvatarSeed, isAi, aiSourceAnswerIds } =
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
      aiSourceAnswerIds,
    });
    res.status(201).json(answer);
  } catch (err) {
    next(err);
  }
});

// POST /api/questions/:questionId/answers/:answerId/upvote — toggle upvote
router.post(
  '/:questionId/answers/:answerId/upvote',
  async (req, res, next) => {
    try {
      const { direction = 'up' } = req.body || {};
      if (direction !== 'up' && direction !== 'down') {
        return res.status(400).json({ error: 'invalid direction' });
      }
      const result = await answerRepository.toggleUpvote(
        req.params.questionId,
        req.params.answerId,
        direction
      );
      if (!result) {
        return res.status(404).json({ error: 'answer not found' });
      }
      res.json({ upvotes: result.upvotes, upvoted: result.upvoted });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
