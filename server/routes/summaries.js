import { Router } from 'express';
import * as summaryRepository from '../repositories/summaryRepository.js';

const router = Router();

// PUT /api/questions/:questionId/summary — upsert an AI summary
router.put('/:questionId/summary', async (req, res, next) => {
  try {
    const { content, sourceAnswerIds, citations, status } = req.body || {};
    const summary = await summaryRepository.upsertSummary({
      questionId: req.params.questionId,
      content,
      sourceAnswerIds,
      citations,
      status,
    });
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

export default router;
