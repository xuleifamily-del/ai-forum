/**
 * 为单个问题计算个性化推荐评分
 * @param {Object} q 帖子（含 tags、likes/viewCount、answersCount/answerCount、createdAt）
 * @param {Record<string, number>} effectiveTagWeights getEffectiveTagWeights 输出 { 'React': 5.2, 'Vue': 1.3, ... }
 * @param {Date} now 参考时间（测试可注入）
 * @returns number 0..1，稳定无 NaN 无 Infinity
 */
export function scoreQuestionForUser(q, effectiveTagWeights, now = new Date()) {
  const weights = effectiveTagWeights || {};
  const likes = q.likes ?? q.viewCount ?? 0;
  const answersCount = q.answersCount ?? q.answerCount ?? 0;
  const tagList = Array.isArray(q.tags)
    ? q.tags.map((t) => (typeof t === 'string' ? t : t.text || ''))
    : [];

  // 1) tagMatch: 0..1（若 weights 全为 0 直接给 0.5 中性，避免用户无行为时全为 0 导致个性化失效）
  const rawWeight = tagList.reduce((acc, t) => acc + (weights[t] || 0), 0);
  const maxWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let tagMatch = maxWeight > 0 ? Math.min(1, rawWeight / Math.max(1, maxWeight)) : 0.5;

  // 2) hot: 0..1。likes * 2 + answersCount，tanh 归一化
  const hot = Math.min(1, Math.tanh((2 * likes + answersCount) / 10));

  // 3) freshness: 0..1。1 - 1/(1 + t/7)。t = (now - q.createdAt) / 天数
  const createdAtMs = typeof q.createdAt === 'number' ? q.createdAt : new Date(q.createdAt).getTime();
  const tDays = Math.max(0, (now.getTime() - createdAtMs) / (1000 * 60 * 60 * 24));
  const freshness = 1 - 1 / (1 + tDays / 7);

  // 4) 加权：tagMatch * 0.5 + hot * 0.3 + freshness * 0.2
  const score = tagMatch * 0.5 + hot * 0.3 + freshness * 0.2;

  // 防御：NaN/Infinity → 0.5 中性
  if (!isFinite(score)) return 0.5;
  return score;
}

/**
 * 列表排序入口：返回已排序的问题 id 降序问题数组
 */
export function rankForRecommend(questions, { tagWeights, now = new Date(), limit = 20 } = {}) {
  return [...questions]
    .map((q) => ({ q, s: scoreQuestionForUser(q, tagWeights, now) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.q)
    .slice(0, limit);
}
