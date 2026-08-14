import { Router } from 'express';
import * as summaryRepository from '../repositories/summaryRepository.js';

const router = Router();

// GET /api/questions/:questionId/summary — get AI summary by questionId
router.get('/:questionId/summary', async (req, res, next) => {
  try {
    const summary = await summaryRepository.getByQuestionId(req.params.questionId);
    if (!summary) {
      return res.status(404).json({ error: 'summary not found' });
    }
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

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
