import { Router } from 'express';
import * as feedbackRepository from '../repositories/feedbackRepository.js';

const router = Router();

// POST /api/feedback — create a feedback signal
router.post('/', async (req, res, next) => {
  try {
    const { identityId, targetId, targetType, value, comment } = req.body || {};
    const feedback = await feedbackRepository.createFeedback({
      identityId,
      targetId,
      targetType,
      value,
      comment,
    });
    res.status(201).json(feedback);
  } catch (err) {
    next(err);
  }
});

export default router;
