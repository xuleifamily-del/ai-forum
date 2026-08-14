/**
 * AI 服务：封装 AI 相关 API 调用（润色 / 扩写 / 草稿 / 流式回答 / 摘要）。
 * 非流式接口走 apiClient，流式接口使用原生 fetch + ReadableStream + TextDecoder。
 */
import apiClient from './apiClient.js';
import degradationService from './degradationService.js';
import StorageService from './storageService.js';
import { STORAGE_KEYS } from '../constants/forumStorageKeys.js';
import * as questionRepository from './questionRepository.js';

const VAGUE_KEYWORDS = [
  '怎么办',
  '为啥',
  '为什么不',
  '咋弄',
  '搞不定',
  '用不了',
  '出错了',
  '报错',
  '不对',
  '求解答',
  '一直跑',
  '循环',
  '卡死',
  '崩了',
  '跪了',
  '求大佬',
  '不知道怎么',
  '小白请教',
  '急急急',
  'help',
  'sos',
  '问题',
  '求助',
  '不工作',
  '无法显示',
  '加载不出来',
]

const TECH_TERMS = [
  'React', 'Vue', 'JS', 'TS', 'JavaScript', 'TypeScript',
  'Python', 'CSS', 'HTML', 'Node', 'API',
  'useEffect', 'useRef', 'useState',
  '报错', '日志', '堆栈', '状态码', '404', '500',
]

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildKeywordRegex() {
  const escaped = VAGUE_KEYWORDS.map(escapeRegex).join('|')
  return new RegExp(escaped, 'gi')
}

function countTokens(text) {
  if (!text) return 0
  const chars = Array.from(text)
  let count = 0
  let inAsciiWord = false
  for (const ch of chars) {
    const code = ch.codePointAt(0)
    if ((code >= 0x30 && code <= 0x39) || (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a) || code === 0x5f) {
      if (!inAsciiWord) {
        count += 1
        inAsciiWord = true
      }
    } else {
      inAsciiWord = false
      if (/\s/.test(ch)) continue
      count += 1
    }
  }
  return Math.max(count, 1)
}

export function detectVagueness(text) {
  const raw = (typeof text === 'string' ? text : '')
  const normalized = raw.replace(/[\u3000\uff01-\uff5e]/g, (ch) => {
    const code = ch.charCodeAt(0)
    if (code === 0x3000) return ' '
    if (code >= 0xff01 && code <= 0xff5e) return String.fromCharCode(code - 0xfee0)
    return ch
  })
  const plain = normalized.replace(/[，。！？、；：""''（）【】《》,/\\.!?;:\(\)\[\]<>《》'"`~\-_+=@#\$%\^&\*|{}]/g, '')

  const reasons = []
  const suggestions = []
  let isVague = false
  let keywordHits = 0
  const hitKeywords = []

  const kwRegex = buildKeywordRegex()
  let match
  while ((match = kwRegex.exec(normalized)) !== null) {
    keywordHits += 1
    const hit = match[0]
    if (!hitKeywords.includes(hit)) {
      hitKeywords.push(hit)
    }
  }

  if (keywordHits > 0) {
    isVague = true
    reasons.push(`检测到模糊词「${hitKeywords.join('、')}」`)
  }

  const len = Array.from(plain || '').length
  if (len > 0 && len < 10) {
    isVague = true
    reasons.push('标题偏短')
  }

  if (keywordHits >= 1) {
    const lowerNorm = normalized.toLowerCase()
    const hasTech = TECH_TERMS.some((term) => {
      const idx = lowerNorm.indexOf(term.toLowerCase())
      return idx !== -1
    })
    if (!hasTech) {
      isVague = true
      suggestions.push('建议增加具体技术栈名称或报错码')
    }
  }

  const tokenCount = countTokens(normalized)
  if (tokenCount > 0 && keywordHits / tokenCount > 0.3) {
    isVague = true
    reasons.push('模糊词密度过高')
  }

  if (isVague && suggestions.length === 0) {
    suggestions.push('建议补充：具体报错信息、环境版本')
  }

  return {
    isVague,
    reason: reasons.length ? reasons.join('；') : '',
    suggestion: suggestions.join('；'),
  }
}

/**
 * 润色文本
 * @param {{ type: string, text: string, context?: string }} params
 * @returns {Promise<{ text: string, mock: boolean }>}
 */
export async function polish({ type, text, context }) {
  return apiClient.post('/ai/polish', { type, text, context });
}

/**
 * 扩写内容
 * @param {{ title: string, body: string }} params
 * @returns {Promise<{ text: string, mock: boolean }>}
 */
export async function expand({ title, body }) {
  return apiClient.post('/ai/expand', { title, body });
}

/**
 * 起草内容
 * @param {{ intent: string, title?: string, body?: string }} params
 * @returns {Promise<{ text: string, mock: boolean }>}
 */
export async function draft({ intent, title, body }) {
  return apiClient.post('/ai/draft', { intent, title, body });
}

/**
 * 流式生成回答
 * @param {{ questionId: string, title: string, body: string, topAnswers: object[] }} params
 * @param {(delta: string) => void} onDelta
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ mock: boolean }>}
 */
export async function answerStream({ questionId, title, body, topAnswers }, onDelta, signal) {
  const response = await fetch('/api/ai/answer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({ questionId, title, body, topAnswers }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`AI 回答流式请求失败 (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let mock = false;

  // 读取流并按 SSE 帧解析（帧以 \n\n 分隔，每帧内 data: 行为 JSON 载荷）。
  // 出错时直接抛出，交由调用方处理，不在此吞掉异常。
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let frameEnd;
    while ((frameEnd = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, frameEnd);
      buffer = buffer.slice(frameEnd + 2);

      const lines = frame.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload) continue;
        let data;
        try {
          data = JSON.parse(payload);
        } catch {
          continue;
        }
        if (data.delta) {
          onDelta(data.delta);
        }
        if (typeof data.mock === 'boolean') {
          mock = data.mock;
        }
        if (data.done) {
          return { mock };
        }
      }
    }
  }

  return { mock };
}

/**
 * AI 健康检查（用于调试 / 看板判断 AI 是否可用）
 * @returns {Promise<{ ai: boolean, model: string }>}
 */
export async function isAiHealthy() {
  return apiClient.get('/ai/health');
}

function loadSummariesMap() {
  try {
    const stored = StorageService.get(STORAGE_KEYS.SUMMARIES);
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      return stored;
    }
  } catch (_) {
    // ignore
  }
  return {};
}

function saveSummariesMap(map) {
  try {
    StorageService.set(STORAGE_KEYS.SUMMARIES, map);
  } catch (_) {
    // ignore
  }
}

/**
 * 生成 AI 摘要（非流式）
 * @param {{ questionId: string, title: string, body: string, topAnswers?: Array<{id:string,content:string}>, signal?: AbortSignal }} params
 * @returns {Promise<{ content: string, citations: Array<{index:number, answerId:string}>, mock: boolean }>}
 */
export async function generateSummary({ questionId, title, body, topAnswers, signal }) {
  const safeTopAnswers = Array.isArray(topAnswers)
    ? topAnswers.map((a) => ({ id: a?.id, content: a?.content || '' })).filter((a) => a.id)
    : [];
  try {
    const result = await apiClient.post('/ai/summary', {
      questionId,
      title,
      body,
      topAnswers: safeTopAnswers,
    });
    const prebuiltCitations = Array.isArray(result?.citations)
      ? result.citations
      : safeTopAnswers.map((ans, idx) => ({ index: idx + 1, answerId: ans.id }));
    return {
      content: result?.content || '',
      citations: prebuiltCitations,
      mock: result?.mock === true,
    };
  } catch (err) {
    try {
      degradationService.reportFailure(err?.message || 'summary_api_error');
    } catch (_) {
      // ignore
    }
    throw err;
  }
}

/**
 * 提交摘要反馈
 * @param {{ questionId?: string, summaryId?: string, type: 'helpful'|'needsUpdate'|'inaccurate', comment?: string }} params
 * @returns {Promise<{ ok: boolean, feedbackCount: number, status?: string }>}
 */
export async function submitSummaryFeedback({ questionId, summaryId, type, comment }) {
  try {
    const result = await apiClient.post('/ai/summary/feedback', {
      questionId,
      summaryId,
      type,
      comment,
    });
    return {
      ok: result?.ok === true,
      feedbackCount: result?.feedbackCount || 0,
      status: result?.status,
    };
  } catch (err) {
    return { ok: false, feedbackCount: 0 };
  }
}

/**
 * 双写持久化摘要：localStorage + 后端 PostgreSQL upsert（尽力而为）
 * @param {{ questionId: string, content: string, sourceAnswerIds?: string[], citations?: Array<{index:number,answerId:string,snippet?:string}>, status?: 'stable'|'outdated'|'regenerating'|'updated' }} params
 * @returns {Promise<import('../types/forum.js').AISummary>}
 */
export async function upsertSummaryToStorage({ questionId, content, sourceAnswerIds = [], citations = [], status = 'stable' }) {
  const now = Date.now();
  const summaries = loadSummariesMap();
  const existing = summaries[questionId];
  const generatedAt = existing?.generatedAt || now;

  const stored = {
    id: existing?.id || `local-${questionId}-${now}`,
    questionId,
    content,
    sourceAnswerIds: Array.isArray(sourceAnswerIds) ? sourceAnswerIds : [],
    citations: Array.isArray(citations) ? citations : [],
    status,
    generatedAt,
    updatedAt: now,
    feedbackCount: existing?.feedbackCount || { helpful: 0, needsUpdate: 0, inaccurate: 0 },
  };

  summaries[questionId] = stored;
  saveSummariesMap(summaries);

  try {
    const serverResult = await questionRepository.upsertSummary(questionId, {
      content,
      sourceAnswerIds: stored.sourceAnswerIds,
      citations: stored.citations,
      status,
    });
    if (serverResult && serverResult.id) {
      stored.id = serverResult.id;
      stored.generatedAt = serverResult.generatedAt || stored.generatedAt;
      stored.updatedAt = serverResult.updatedAt || stored.updatedAt;
      stored.feedbackCount = serverResult.feedbackCount || stored.feedbackCount;
      const s2 = loadSummariesMap();
      s2[questionId] = stored;
      saveSummariesMap(s2);
    }
  } catch (_) {
    // 后端失败不阻断，已做 localStorage 持久化
  }

  return stored;
}

/**
 * 从 localStorage 读取某问题的摘要
 * @param {string} questionId
 * @returns {import('../types/forum.js').AISummary | null}
 */
export function getLocalSummary(questionId) {
  try {
    const map = loadSummariesMap();
    return map[questionId] || null;
  } catch (_) {
    return null;
  }
}

/**
 * 改写搜索查询
 * @param {{ query: string }} params
 * @returns {Promise<{ rewritten: string, keywords: string[], mock: boolean }>}
 */
export async function searchRewrite({ query }) {
  return apiClient.post('/ai/search-rewrite', { query });
}

/**
 * 生成搜索摘要（非流式）
 * @param {{ query: string, rewritten?: string, topQuestions?: Array<{id:string,title:string,excerpt:string,tags?:string[]}> }} params
 * @returns {Promise<{ content: string, mock: boolean }>}
 */
export async function searchSummary({ query, rewritten, topQuestions }) {
  try {
    const result = await apiClient.post('/ai/search-summary', {
      query,
      rewritten,
      topQuestions,
    });
    return {
      content: result?.content || '',
      mock: result?.mock === true,
    };
  } catch (err) {
    try {
      degradationService.reportFailure(err?.message || 'search_summary_api_error');
    } catch (_) {
      // ignore
    }
    throw err;
  }
}
