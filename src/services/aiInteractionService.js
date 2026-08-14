/**
 * AI 交互记录服务：将每次 AI 调用（润色 / 扩写 / 草稿 / 回答）的元数据
 * 持久化到 localStorage，供数据看板统计真实 AI 与 mock 兜底的使用情况。
 */
import StorageService from './storageService.js';
import { STORAGE_KEYS } from '../constants/forumStorageKeys.js';

const MAX_RECORDS = 200;
const TYPES = ['polish', 'expand', 'draft', 'answer'];

function hasLocalStorage() {
  return typeof localStorage !== 'undefined';
}

/**
 * 记录一次 AI 交互
 * @param {{ type: string, success: boolean, mock: boolean, duration?: number, timestamp?: number }} record
 */
export function record({ type, success, mock, duration, timestamp = Date.now() }) {
  if (!hasLocalStorage()) return;
  try {
    const list = getAll();
    list.push({ type, success, mock, duration, timestamp });
    // 超出上限时丢弃最旧的记录
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
 * @returns {{ total: number, realCount: number, mockCount: number, byType: Record<string, { real: number, mock: number }> }}
 */
export function getStats() {
  const byType = {};
  for (const t of TYPES) {
    byType[t] = { real: 0, mock: 0 };
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
      }
    }
  } catch (err) {
    console.warn('[AiInteractionService] getStats failed', err);
  }

  return { total, realCount, mockCount, byType };
}
