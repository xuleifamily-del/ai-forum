/**
 * 前端仓储层：封装对后端 /api 的调用，返回与 src/types/forum.js 一致的对象。
 */
import apiClient from './apiClient.js';

/**
 * 获取问题列表
 * @param {{ sort?: 'latest'|'hot', limit?: number, offset?: number, tag?: string }} params
 * @returns {Promise<{ items: import('../types/forum.js').Question[], total: number }>}
 */
export async function fetchQuestions(params = {}) {
  return apiClient.get('/questions', params);
}

/**
 * 获取问题详情（含回答列表与 AI 摘要）
 * @param {string} id
 * @returns {Promise<(import('../types/forum.js').Question & { answers: import('../types/forum.js').Answer[], aiSummary: import('../types/forum.js').AISummary | null }) | null>}
 */
export async function fetchQuestionDetail(id) {
  try {
    return await apiClient.get(`/questions/${id}`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

/**
 * 创建问题
 * @param {{ title: string, body: string, tags: string[], authorId: string, authorName: string, authorAvatarSeed: string, aiAssisted?: boolean }} data
 * @returns {Promise<import('../types/forum.js').Question>}
 */
export async function createQuestion(data) {
  return apiClient.post('/questions', data);
}

/**
 * 浏览数 +1
 * @param {string} id
 */
export async function incrementView(id) {
  return apiClient.post(`/questions/${id}/view`);
}

/**
 * 创建回答
 * @param {string} questionId
 * @param {{ content: string, authorId: string, authorName: string, authorAvatarSeed: string, isAi?: boolean }} data
 * @returns {Promise<import('../types/forum.js').Answer>}
 */
export async function createAnswer(questionId, data) {
  return apiClient.post(`/questions/${questionId}/answers`, data);
}

/**
 * 切换回答点赞状态
 * @param {string} questionId
 * @param {string} answerId
 * @param {'up'|'down'} [direction='up']
 * @returns {Promise<{ upvotes: number, upvoted: boolean }>}
 */
export async function toggleUpvote(questionId, answerId, direction = 'up') {
  return apiClient.post(`/questions/${questionId}/answers/${answerId}/upvote`, { direction });
}

/**
 * 创建 / 更新 AI 摘要
 * @param {string} questionId
 * @param {{ content: string, sourceAnswerIds: string[], citations: object[], status?: string }} data
 * @returns {Promise<import('../types/forum.js').AISummary>}
 */
export async function upsertSummary(questionId, data) {
  return apiClient.put(`/questions/${questionId}/summary`, data);
}

/**
 * 提交反馈
 * @param {{ identityId: string, targetId: string, targetType: 'SUMMARY'|'ANSWER', value: 1|-1|0, comment?: string }} data
 */
export async function submitFeedback(data) {
  return apiClient.post('/feedback', data);
}

/**
 * 健康检查
 * @returns {Promise<{ status: string, db: boolean }>}
 */
export async function checkHealth() {
  return apiClient.get('/health');
}
