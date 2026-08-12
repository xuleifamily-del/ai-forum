import StorageService from './storageService.js';
import { STORAGE_KEYS } from '../constants/forumStorageKeys.js';
import { ADJECTIVES, NOUNS, GRADIENT_PALETTES, AVATAR_ANGLES } from '../constants/forumNickname.js';

function generateUUIDFallback() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateUUID() {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return generateUUIDFallback();
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

let identityRef = null;

const IdentityService = {
  getOrCreate() {
    if (identityRef) {
      return identityRef;
    }

    let identity = StorageService.get(STORAGE_KEYS.IDENTITY);
    if (identity) {
      identityRef = identity;
      return identityRef;
    }

    identity = this.generate();
    StorageService.set(STORAGE_KEYS.IDENTITY, identity);

    const profile = this.createEmptyBehaviorProfile(identity.id);
    StorageService.set(STORAGE_KEYS.BEHAVIOR, profile);

    identityRef = identity;
    return identityRef;
  },

  generate() {
    const id = generateUUID();

    const rawAdj = pickRandom(ADJECTIVES);
    const adj = rawAdj.endsWith('的') ? rawAdj.slice(0, -1) : rawAdj;
    const noun = pickRandom(NOUNS);
    const nickname = `${adj}的${noun}`;

    const palette = pickRandom(GRADIENT_PALETTES);
    const angle = pickRandom(AVATAR_ANGLES);
    const avatarSeed = `${palette.color1}|${palette.color2}|${angle}`;

    const now = Date.now();
    return {
      id,
      nickname,
      avatarSeed,
      createdAt: now,
      lastActiveAt: now,
    };
  },

  createEmptyBehaviorProfile(identityId) {
    return {
      identityId,
      tagWeights: {},
      viewedQuestionIds: [],
      upvotedAnswerIds: [],
      searchHistory: [],
      aiUsageStats: {
        totalCalls: 0,
        byFeature: {},
        lastUsedAt: 0,
      },
      updatedAt: Date.now(),
    };
  },

  reset() {
    StorageService.remove(STORAGE_KEYS.IDENTITY);
    StorageService.remove(STORAGE_KEYS.BEHAVIOR);
    identityRef = null;
  },

  touchLastActive() {
    const identity = this.getOrCreate();
    identity.lastActiveAt = Date.now();
    StorageService.set(STORAGE_KEYS.IDENTITY, identity);
  },
};

export default IdentityService;

// 开发环境暴露全局调试接口（仅 DEV 模式）
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  window.__AIFORUM__ = window.__AIFORUM__ || {};
  window.__AIFORUM__.identity = IdentityService;
  window.__AIFORUM__.resetAll = () => {
    StorageService.clearAll();
    if (typeof location !== 'undefined') location.reload();
  };
}
