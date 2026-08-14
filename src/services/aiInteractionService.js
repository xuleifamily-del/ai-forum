/**
 * AI 交互记录服务：将每次 AI 调用（润色 / 扩写 / 草稿 / 回答 / 摘要 / 搜索）的元数据
 * 持久化到 localStorage，供数据看板统计真实 AI 与 mock 兜底的使用情况。
 */
import StorageService from './storageService.js';
import { STORAGE_KEYS } from '../constants/forumStorageKeys.js';

const MAX_RECORDS = 200;
const SESSION_GAP_MS = 30 * 60 * 1000;
const TYPES = ['polish', 'expand', 'draft', 'answer', 'summary', 'feedback', 'search'];

function hasLocalStorage() {
  return typeof localStorage !== 'undefined';
}

/**
 * 记录一次 AI 交互
 * @param {{ type: string, success: boolean, mock: boolean, duration?: number, timestamp?: number, targetId?: string, feedbackType?: string, subType?: string }} record
 */
export function record({ type, success, mock, duration, timestamp = Date.now(), targetId, feedbackType, subType }) {
  if (!hasLocalStorage()) return;
  try {
    const list = getAll();
    const entry = { type, success, mock, duration, timestamp };
    if (targetId !== undefined) entry.targetId = targetId;
    if (feedbackType !== undefined) entry.feedbackType = feedbackType;
    if (subType !== undefined) entry.subType = subType;
    list.push(entry);
    if (list.length > MAX_RECORDS) {
      list.splice(0, list.length - MAX_RECORDS);
    }
    StorageService.set(STORAGE_KEYS.AI_INTERACTIONS, list);
  } catch (err) {
    console.warn('[AiInteractionService] record failed', err);
  }
}

/**
 * 读取全部 AI 交互记录
 * @returns {Array<{ type: string, success: boolean, mock: boolean, duration?: number, timestamp: number }>}
 */
export function getAll() {
  if (!hasLocalStorage()) return [];
  try {
    const stored = StorageService.get(STORAGE_KEYS.AI_INTERACTIONS);
    if (!Array.isArray(stored)) return [];
    return stored;
  } catch (err) {
    console.warn('[AiInteractionService] getAll failed', err);
    return [];
  }
}

/**
 * 汇总统计，供数据看板展示
 * @returns {{ total: { total: number, real: number, mock: number }, totalCount: number, realCount: number, mockCount: number, byType: Record<string, { real: number, mock: number, total: number }> }}
 */
export function getStats() {
  const byType = {};
  for (const t of TYPES) {
    byType[t] = { real: 0, mock: 0, total: 0 };
  }
  let total = 0;
  let realCount = 0;
  let mockCount = 0;

  try {
    const list = getAll();
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      total += 1;
      const isMock = item.mock === true;
      if (isMock) {
        mockCount += 1;
      } else {
        realCount += 1;
      }
      const bucket = byType[item.type];
      if (bucket) {
        if (isMock) bucket.mock += 1;
        else bucket.real += 1;
        bucket.total += 1;
      }
    }
  } catch (err) {
    console.warn('[AiInteractionService] getStats failed', err);
  }

  return {
    total: { total, real: realCount, mock: mockCount },
    totalCount: total,
    realCount,
    mockCount,
    byType,
  };
}

/**
 * 记录摘要反馈
 * @param {Object} p { questionId, summaryId, type: 'helpful'|'needsUpdate'|'inaccurate', helpful?: boolean }
 */
export function recordFeedback({ questionId, summaryId, type, helpful = undefined }) {
  if (!hasLocalStorage()) return;
  try {
    const list = StorageService.get(STORAGE_KEYS.AI_FEEDBACK) || [];
    list.unshift({
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      questionId,
      summaryId,
      type,
      helpful: helpful === undefined ? type === 'helpful' : helpful,
      createdAt: new Date().toISOString(),
    });
    StorageService.set(STORAGE_KEYS.AI_FEEDBACK, list);
  } catch (err) {
    console.warn('[AiInteractionService] recordFeedback failed', err);
  }
}

export function getFeedbackStats() {
  if (!hasLocalStorage()) {
    return { total: 0, helpful: 0, needsUpdate: 0, inaccurate: 0, helpfulRate: null };
  }
  try {
    const list = StorageService.get(STORAGE_KEYS.AI_FEEDBACK) || [];
    const total = list.length;
    const helpful = list.filter((x) => x.helpful === true).length;
    const needsUpdate = list.filter((x) => x.type === 'needsUpdate').length;
    const inaccurate = list.filter((x) => x.type === 'inaccurate').length;
    return {
      total,
      helpful,
      needsUpdate,
      inaccurate,
      helpfulRate: total === 0 ? null : Number((helpful / total).toFixed(4)),
    };
  } catch (err) {
    console.warn('[AiInteractionService] getFeedbackStats failed', err);
    return { total: 0, helpful: 0, needsUpdate: 0, inaccurate: 0, helpfulRate: null };
  }
}

function getOrCreateSessionId() {
  if (!hasLocalStorage()) return null;
  try {
    const sessions = StorageService.get(STORAGE_KEYS.AI_SESSIONS) || [];
    const now = Date.now();
    let current = sessions.find((s) => now - s.lastActiveAt < SESSION_GAP_MS);
    if (!current) {
      current = {
        id: `sess-${Date.now()}`,
        startAt: now,
        lastActiveAt: now,
        eligible: false,
      };
      sessions.push(current);
      StorageService.set(STORAGE_KEYS.AI_SESSIONS, sessions);
    } else {
      current.lastActiveAt = now;
      StorageService.set(STORAGE_KEYS.AI_SESSIONS, sessions);
    }
    return current.id;
  } catch (err) {
    console.warn('[AiInteractionService] getOrCreateSessionId failed', err);
    return null;
  }
}

export function markSessionEligible(page = '') {
  if (!hasLocalStorage()) return;
  try {
    getOrCreateSessionId();
    const sessions = StorageService.get(STORAGE_KEYS.AI_SESSIONS) || [];
    const now = Date.now();
    const current = sessions.find((s) => now - s.lastActiveAt < SESSION_GAP_MS);
    if (!current) return;
    current.eligible = true;
    if (page) {
      current.pages = Array.from(new Set([...(current.pages || []), page]));
    }
    StorageService.set(STORAGE_KEYS.AI_SESSIONS, sessions);
  } catch (err) {
    console.warn('[AiInteractionService] markSessionEligible failed', err);
  }
}

export function getUsageRate() {
  const stats = getStats();
  let sessions = [];
  if (hasLocalStorage()) {
    try {
      sessions = StorageService.get(STORAGE_KEYS.AI_SESSIONS) || [];
    } catch (_) {
      sessions = [];
    }
  }
  const eligibleSessions = sessions.filter((s) => s.eligible).length;
  const totalSuccess = Object.values(stats.byType).reduce(
    (acc, x) => acc + (x.real || 0) + (x.mock || 0),
    0
  );
  return {
    eligibleSessions,
    totalSuccess,
    usageRate: eligibleSessions === 0 ? null : Number((totalSuccess / eligibleSessions).toFixed(4)),
    sessions,
  };
}
