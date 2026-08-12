import StorageService from './storageService.js';
import { STORAGE_KEYS } from '../constants/forumStorageKeys.js';
import { seedQuestions, seedAnswers, seedSummaries } from '../seed/forumSeedData.js';

const SeedService = {
  shouldLoad() {
    const seed = StorageService.get(STORAGE_KEYS.SEED_DATA);
    if (seed?.loaded) return false;
    const questions = StorageService.get(STORAGE_KEYS.QUESTIONS);
    if (questions && questions.length > 0) return false;
    return true;
  },

  inject() {
    if (!this.shouldLoad()) return false;

    const questionsBefore = StorageService.get(STORAGE_KEYS.QUESTIONS);
    const answersBefore = StorageService.get(STORAGE_KEYS.ANSWERS);
    const summariesBefore = StorageService.get(STORAGE_KEYS.SUMMARIES);

    try {
      StorageService.set(STORAGE_KEYS.QUESTIONS, seedQuestions);
    } catch (err) {
      throw err;
    }

    try {
      StorageService.set(STORAGE_KEYS.ANSWERS, seedAnswers);
    } catch (err) {
      if (questionsBefore === null || questionsBefore === undefined) {
        StorageService.remove(STORAGE_KEYS.QUESTIONS);
      } else {
        StorageService.set(STORAGE_KEYS.QUESTIONS, questionsBefore);
      }
      throw err;
    }

    try {
      StorageService.set(STORAGE_KEYS.SUMMARIES, seedSummaries);
    } catch (err) {
      if (questionsBefore === null || questionsBefore === undefined) {
        StorageService.remove(STORAGE_KEYS.QUESTIONS);
      } else {
        StorageService.set(STORAGE_KEYS.QUESTIONS, questionsBefore);
      }
      if (answersBefore === null || answersBefore === undefined) {
        StorageService.remove(STORAGE_KEYS.ANSWERS);
      } else {
        StorageService.set(STORAGE_KEYS.ANSWERS, answersBefore);
      }
      throw err;
    }

    StorageService.set(STORAGE_KEYS.SEED_DATA, {
      loaded: true,
      loadedAt: Date.now(),
    });

    return true;
  },
};

export default SeedService;
