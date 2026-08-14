import { seedQuestions, seedAnswers } from '../seed/forumSeedData.js';
import StorageService from './storageService.js';
import { STORAGE_KEYS } from '../constants/forumStorageKeys.js';

/**
 * @typedef {Object} RetrievedAnswer
 * @property {string} id - Answer ID
 * @property {string} questionId - 所属问题 ID
 * @property {string} content - 回答完整内容
 * @property {string} snippet - 回答内容前 120 字符摘要
 * @property {number} score - 综合相似度分数 (0-1)
 */

/**
 * @typedef {Object} RetrievedQuestion
 * @property {string} id - Question ID
 * @property {string} title - 问题标题
 * @property {string} excerpt - 问题正文摘要（前 120 字符）
 * @property {string[]} tags - 问题标签
 * @property {number} viewCount - 浏览数
 * @property {number} answerCount - 回答数
 * @property {number} createdAt - 创建时间戳
 * @property {number} score - 综合相似度分数 (0-1)
 */

/**
 * @typedef {Object} Citation
 * @property {number} index - 引用编号（从 1 开始）
 * @property {string} answerId - 来源 Answer.id
 * @property {string} snippet - 被引用位置周围 ±40 字符的片段
 */

const CJK_REGEX = /[\u4e00-\u9fa5]/;
const PUNCTUATION_REGEX = /[\s,.!?;:()\[\]{}<>'"\/\\|@#$%^&*_+=`~·，。！？；：（）【】｛｝《》、'"\/\\｜＠＃￥％…＊—＝＋｀～\-]+/g;

function loadQuestions() {
  try {
    const stored = StorageService.get(STORAGE_KEYS.QUESTIONS);
    if (Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
  } catch (_) {
    // ignore
  }
  return seedQuestions;
}

function loadAnswers() {
  try {
    const stored = StorageService.get(STORAGE_KEYS.ANSWERS);
    if (Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
  } catch (_) {
    // ignore
  }
  return seedAnswers;
}

function normalizeText(text) {
  if (!text) return '';
  return String(text).toLowerCase();
}

function tokenize(text) {
  if (!text) return [];
  const normalized = normalizeText(text);
  const rawTokens = normalized.split(PUNCTUATION_REGEX).filter(Boolean);
  const tokens = [];
  for (const token of rawTokens) {
    if (CJK_REGEX.test(token)) {
      for (let i = 0; i < token.length - 1; i++) {
        tokens.push(token.slice(i, i + 2));
      }
      for (let i = 0; i < token.length; i++) {
        tokens.push(token[i]);
      }
    } else {
      if (token.length >= 2) {
        tokens.push(token);
      }
    }
  }
  return tokens;
}

function buildQuestionIdToTags(questions) {
  const map = new Map();
  for (const q of questions) {
    map.set(q.id, Array.isArray(q.tags) ? q.tags : []);
  }
  return map;
}

function computeTokenOverlapScore(queryTokens, candidateTokens) {
  if (!queryTokens.length || !candidateTokens.length) return 0;
  const querySet = new Set(queryTokens);
  const candidateSet = new Set(candidateTokens);
  let intersection = 0;
  for (const t of querySet) {
    if (candidateSet.has(t)) intersection++;
  }
  if (intersection === 0) return 0;
  const union = querySet.size + candidateSet.size - intersection;
  return intersection / Math.max(1, union);
}

function computeTagMatchScore(queryTags, candidateTags) {
  const qTags = Array.isArray(queryTags) ? queryTags.filter(Boolean) : [];
  const cTags = Array.isArray(candidateTags) ? candidateTags.filter(Boolean) : [];
  if (qTags.length === 0) return 0;
  const cSet = new Set(cTags.map(t => String(t).toLowerCase()));
  let overlap = 0;
  for (const t of qTags) {
    if (cSet.has(String(t).toLowerCase())) overlap++;
  }
  return overlap / Math.max(1, qTags.length);
}

function buildDocumentFrequency(allDocumentsTokens) {
  const df = new Map();
  const totalDocs = allDocumentsTokens.length;
  for (const docTokens of allDocumentsTokens) {
    const uniqueTokens = new Set(docTokens);
    for (const token of uniqueTokens) {
      df.set(token, (df.get(token) || 0) + 1);
    }
  }
  return { df, totalDocs };
}

function computeBm25LikeScore(queryTokens, candidateTokens, df, totalDocs) {
  if (!queryTokens.length || !candidateTokens.length) return 0;
  const termFreq = new Map();
  for (const t of candidateTokens) {
    termFreq.set(t, (termFreq.get(t) || 0) + 1);
  }
  const uniqueQueryTokens = [...new Set(queryTokens)];
  let score = 0;
  let maxPossibleScore = 0;
  for (const qToken of uniqueQueryTokens) {
    const docFreq = df.get(qToken) || 0;
    const idf = Math.log((totalDocs + 1) / (docFreq + 1)) + 1;
    const tf = termFreq.get(qToken) || 0;
    score += tf * idf;
    maxPossibleScore += idf;
  }
  if (maxPossibleScore === 0) return 0;
  const normalized = score / maxPossibleScore;
  return Math.min(1, normalized);
}

/**
 * 从所有问题中检索与给定问题最相似的 top-N 回答
 * @param {{ questionId?: string, title: string, body: string, tags?: string[], n?: number }} params
 * @param {string} [params.questionId] - 当前问题 ID（可选，用于排除自身回答或优先排序）
 * @param {string} params.title - 问题标题
 * @param {string} params.body - 问题正文
 * @param {string[]} [params.tags=[]] - 问题标签列表
 * @param {number} [params.n=5] - 返回 top-N 结果
 * @returns {RetrievedAnswer[]} 按 finalScore 降序排列的回答数组，每个元素 { id, questionId, content, snippet, score }
 */
export function retrieveTopAnswers({ questionId, title, body, tags = [], n = 5 }) {
  const questions = loadQuestions();
  const answers = loadAnswers();
  const qidToTags = buildQuestionIdToTags(questions);

  const queryText = `${title || ''} ${body || ''}`;
  const queryTokens = tokenize(queryText);

  const allAnswersTokens = answers.map(a => tokenize(a.content));
  const { df, totalDocs } = buildDocumentFrequency(allAnswersTokens);

  const scored = answers.map((answer, idx) => {
    const answerTokens = allAnswersTokens[idx];
    const answerTags = qidToTags.get(answer.questionId) || [];

    const tokenOverlapScore = computeTokenOverlapScore(queryTokens, answerTokens);
    const tagMatchScore = computeTagMatchScore(tags, answerTags);
    const bm25LikeScore = computeBm25LikeScore(queryTokens, answerTokens, df, totalDocs);

    const finalScore =
      0.45 * tokenOverlapScore +
      0.25 * tagMatchScore +
      0.30 * bm25LikeScore;

    const snippet = (answer.content || '').slice(0, 120);

    return {
      id: answer.id,
      questionId: answer.questionId,
      content: answer.content,
      snippet,
      score: finalScore,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const topN = scored.slice(0, Math.max(1, n));
  return topN;
}

/**
 * 从所有问题中检索与查询最相似的 top-N 问题
 * @param {{ query: string, tags?: string[], n?: number }} params
 * @param {string} params.query - 搜索查询文本
 * @param {string[]} [params.tags=[]] - 期望匹配的标签列表
 * @param {number} [params.n=8] - 返回 top-N 结果
 * @returns {RetrievedQuestion[]} 按 finalScore 降序排列的问题数组，每个元素 { id, title, excerpt, tags, viewCount, answerCount, createdAt, score }
 */
export function retrieveTopQuestions({ query, tags = [], n = 8 }) {
  const questions = loadQuestions();

  const queryText = query || '';
  const queryTokens = tokenize(queryText);

  const allQuestionsTokens = questions.map(q =>
    tokenize(`${q.title || ''} ${q.body || ''} ${(q.tags || []).join(' ')}`)
  );
  const { df, totalDocs } = buildDocumentFrequency(allQuestionsTokens);

  const scored = questions.map((question, idx) => {
    const qTokens = allQuestionsTokens[idx];
    const qTags = Array.isArray(question.tags) ? question.tags : [];

    const tokenOverlapScore = computeTokenOverlapScore(queryTokens, qTokens);
    const tagMatchScore = computeTagMatchScore(tags, qTags);
    const bm25LikeScore = computeBm25LikeScore(queryTokens, qTokens, df, totalDocs);

    const finalScore =
      0.4 * tokenOverlapScore +
      0.3 * tagMatchScore +
      0.3 * bm25LikeScore;

    const excerpt = (question.body || '').slice(0, 120);

    return {
      id: question.id,
      title: question.title,
      excerpt,
      tags: qTags,
      viewCount: question.viewCount || 0,
      answerCount: question.answerCount || 0,
      createdAt: question.createdAt || 0,
      score: finalScore,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const topN = scored.slice(0, Math.max(1, n));
  return topN;
}

/**
 * 从 LLM 返回文本中解析 [N] 格式的引用标记，生成 Citation 数组
 * @param {string} text - LLM 返回的原始文本（包含 [1], [2] 等引用标记）
 * @param {string[]} [sourceAnswerIds=[]] - 候选 answerId 数组，长度决定合法索引上限（index 从 1 开始）
 * @returns {Citation[]} 解析出的引用数组，格式 [{ index, answerId, snippet }]；越界/非法索引被忽略
 */
export function parseCitations(text, sourceAnswerIds = []) {
  if (!text || typeof text !== 'string') return [];
  if (!Array.isArray(sourceAnswerIds) || sourceAnswerIds.length === 0) return [];

  const citations = [];
  const citationRegex = /\[(\d+)\]/g;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    const indexStr = match[1];
    const index = parseInt(indexStr, 10);

    if (Number.isNaN(index) || index < 1 || index > sourceAnswerIds.length) {
      continue;
    }

    const answerId = sourceAnswerIds[index - 1];
    if (!answerId) continue;

    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;
    const textLength = text.length;

    const snippetStart = Math.max(0, matchStart - 40);
    const snippetEnd = Math.min(textLength, matchEnd + 40);
    const snippet = text.slice(snippetStart, snippetEnd);

    citations.push({
      index,
      answerId,
      snippet,
    });
  }

  return citations;
}

export default {
  retrieveTopAnswers,
  retrieveTopQuestions,
  parseCitations,
};
