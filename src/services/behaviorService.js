import StorageService from './storageService.js';
import { STORAGE_KEYS } from '../constants/forumStorageKeys.js';

const MAX_ARRAY_SIZE = 200;
const DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * DAY_MS;
const THIRTY_DAYS_MS = 30 * DAY_MS;

function hasLocalStorage() {
  return typeof localStorage !== 'undefined';
}

function createDefaultBehavior() {
  return {
    viewedQuestionIds: [],
    upvotedAnswerIds: [],
    tagWeights: {},
    updatedAt: Date.now(),
  };
}

// Prune tag entries whose weight has decayed to 0 and haven't been touched
// in over 30 days. Keeps the record from growing without bound.
function pruneTagWeights(tagWeights) {
  if (!tagWeights || typeof tagWeights !== 'object') return {};
  const now = Date.now();
  const pruned = {};
  for (const [tag, record] of Object.entries(tagWeights)) {
    if (!record || typeof record !== 'object') continue;
    const weight = typeof record.weight === 'number' ? record.weight : 0;
    const lastUpdate = typeof record.lastUpdate === 'number' ? record.lastUpdate : 0;
    if (weight <= 0 && (now - lastUpdate) > THIRTY_DAYS_MS) {
      continue;
    }
    pruned[tag] = { weight, lastUpdate };
  }
  return pruned;
}

export function getBehavior() {
  if (!hasLocalStorage()) {
    return createDefaultBehavior();
  }
  try {
    const stored = StorageService.get(STORAGE_KEYS.BEHAVIOR);
    if (!stored || typeof stored !== 'object') {
      return createDefaultBehavior();
    }
    return {
      ...createDefaultBehavior(),
      ...stored,
      viewedQuestionIds: Array.isArray(stored.viewedQuestionIds) ? stored.viewedQuestionIds : [],
      upvotedAnswerIds: Array.isArray(stored.upvotedAnswerIds) ? stored.upvotedAnswerIds : [],
      tagWeights: (stored.tagWeights && typeof stored.tagWeights === 'object') ? stored.tagWeights : {},
      updatedAt: typeof stored.updatedAt === 'number' ? stored.updatedAt : Date.now(),
    };
  } catch (err) {
    console.warn('[BehaviorService] getBehavior failed', err);
    return createDefaultBehavior();
  }
}

export function saveBehavior(record) {
  if (!hasLocalStorage()) return;
  try {
    const base = record && typeof record === 'object' ? record : createDefaultBehavior();
    const normalized = {
      ...base,
      tagWeights: pruneTagWeights(base.tagWeights || {}),
      updatedAt: Date.now(),
    };
    StorageService.set(STORAGE_KEYS.BEHAVIOR, normalized);
  } catch (err) {
    console.warn('[BehaviorService] saveBehavior failed', err);
  }
}

export function recordView(questionId, tags = []) {
  if (!questionId) return;
  try {
    const behavior = getBehavior();
    const viewed = behavior.viewedQuestionIds.filter((id) => id !== questionId);
    viewed.push(questionId);
    if (viewed.length > MAX_ARRAY_SIZE) {
      viewed.splice(0, viewed.length - MAX_ARRAY_SIZE);
    }
    const tagWeights = { ...behavior.tagWeights };
    const now = Date.now();
    for (const tag of tags) {
      if (!tag) continue;
      const current = tagWeights[tag] || { weight: 0, lastUpdate: 0 };
      tagWeights[tag] = {
        weight: (typeof current.weight === 'number' ? current.weight : 0) + 1.0,
        lastUpdate: now,
      };
    }
    saveBehavior({
      ...behavior,
      viewedQuestionIds: viewed,
      tagWeights,
    });
  } catch (err) {
    console.warn('[BehaviorService] recordView failed', err);
  }
}

export function recordSearch(query) {
  if (!query || typeof query !== 'string') return;
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    const behavior = getBehavior();
    const existing = Array.isArray(behavior.searchQueries) ? behavior.searchQueries : [];
    const deduped = existing.filter((q) => q !== trimmed);
    deduped.unshift(trimmed);
    const bounded = deduped.slice(0, 50);
    saveBehavior({
      ...behavior,
      searchQueries: bounded,
    });
  } catch (err) {
    console.warn('[BehaviorService] recordSearch failed', err);
  }
}

export function recordUpvote(answerId, tags = []) {
  if (!answerId) return { upvoted: false };
  try {
    const behavior = getBehavior();
    const upvotedIds = behavior.upvotedAnswerIds;
    const alreadyUpvoted = upvotedIds.includes(answerId);
    const tagWeights = { ...behavior.tagWeights };
    const now = Date.now();

    let newUpvotedIds;
    if (alreadyUpvoted) {
      // Toggle down: remove the answer and decrement each tag weight (floor 0).
      // lastUpdate is preserved so a downvote does not refresh the decay timer.
      newUpvotedIds = upvotedIds.filter((id) => id !== answerId);
      for (const tag of tags) {
        if (!tag) continue;
        const current = tagWeights[tag];
        if (current) {
          tagWeights[tag] = {
            weight: Math.max(0, (typeof current.weight === 'number' ? current.weight : 0) - 1.0),
            lastUpdate: typeof current.lastUpdate === 'number' ? current.lastUpdate : now,
          };
        }
      }
    } else {
      newUpvotedIds = [...upvotedIds, answerId];
      if (newUpvotedIds.length > MAX_ARRAY_SIZE) {
        newUpvotedIds.splice(0, newUpvotedIds.length - MAX_ARRAY_SIZE);
      }
      for (const tag of tags) {
        if (!tag) continue;
        const current = tagWeights[tag] || { weight: 0, lastUpdate: 0 };
        tagWeights[tag] = {
          weight: (typeof current.weight === 'number' ? current.weight : 0) + 1.0,
          lastUpdate: now,
        };
      }
    }

    saveBehavior({
      ...behavior,
      upvotedAnswerIds: newUpvotedIds,
      tagWeights,
    });

    return { upvoted: !alreadyUpvoted };
  } catch (err) {
    console.warn('[BehaviorService] recordUpvote failed', err);
    return { upvoted: false };
  }
}

export function getEffectiveTagWeights() {
  try {
    const behavior = getBehavior();
    const now = Date.now();
    const result = {};
    for (const [tag, record] of Object.entries(behavior.tagWeights)) {
      if (!record || typeof record.weight !== 'number') continue;
      const elapsed = now - (typeof record.lastUpdate === 'number' ? record.lastUpdate : 0);
      let factor;
      if (elapsed <= SEVEN_DAYS_MS) {
        factor = 1.0;
      } else if (elapsed <= THIRTY_DAYS_MS) {
        factor = 0.5;
      } else {
        factor = 0.2;
      }
      result[tag] = record.weight * factor;
    }
    return result;
  } catch (err) {
    console.warn('[BehaviorService] getEffectiveTagWeights failed', err);
    return {};
  }
}

export function hasUpvoted(answerId) {
  if (!answerId) return false;
  try {
    return getBehavior().upvotedAnswerIds.includes(answerId);
  } catch (err) {
    return false;
  }
}

export function hasViewed(questionId) {
  if (!questionId) return false;
  try {
    return getBehavior().viewedQuestionIds.includes(questionId);
  } catch (err) {
    return false;
  }
}

export function reset() {
  try {
    if (!hasLocalStorage()) return;
    const defaultBehavior = createDefaultBehavior();
    saveBehavior(defaultBehavior);
  } catch (err) {
    console.warn('[BehaviorService] reset failed', err);
  }
}
