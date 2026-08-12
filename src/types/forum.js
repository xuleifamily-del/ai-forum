/**
 * @file AI 辅助论坛核心实体类型声明（JSDoc + @typedef）
 */

/**
 * 问题状态枚举
 * @typedef {'open'|'has_ai_answer'|'has_community_answer'|'summarized'|'closed'} QuestionStatus
 */

/**
 * 回答状态枚举
 * @typedef {'draft'|'published'|'outdated'|'hidden'} AnswerStatus
 */

/**
 * AI 摘要状态枚举
 * @typedef {'generating'|'stable'|'outdated'|'regenerating'|'updated'|'feedback_collected'} SummaryStatus
 */

/**
 * AI 功能类型枚举
 * @typedef {'polish'|'summary'|'search'|'draft'|'initial_answer'} AIFeatureType
 */

/**
 * 引用来源：AI 答案中标注的本站出处
 * @typedef {Object} Citation
 * @property {number} index - 引用编号（从 1 开始）
 * @property {string} answerId - 来源 Answer.id
 * @property {string} snippet - 被引用的原文片段
 */

/**
 * 问题实体：用户发布的提问
 * @typedef {Object} Question
 * @property {string} id - UUID v4，问题唯一标识
 * @property {string} title - 问题标题
 * @property {string} titleRaw - 标题原始文本（未处理版，供迁移兼容）
 * @property {string} body - 问题正文（Markdown 格式）
 * @property {string[]} tags - 标签列表（纯文本，如 ['react','hooks']）
 * @property {string} authorId - 发布者 AnonymousIdentity.id
 * @property {QuestionStatus} status - 问题状态
 * @property {boolean} aiAssisted - 是否使用了 AI 辅助提问
 * @property {string[]} relatedQuestionIds - 关联问题 id 列表
 * @property {number} viewCount - 浏览次数
 * @property {number} answerCount - 回答数量
 * @property {number} createdAt - 创建时间（毫秒时间戳）
 * @property {number} updatedAt - 最后更新时间（毫秒时间戳）
 */

/**
 * 回答实体：针对某问题的回复
 * @typedef {Object} Answer
 * @property {string} id - UUID v4，回答唯一标识
 * @property {string} questionId - 所属 Question.id
 * @property {string} authorId - 回答者 AnonymousIdentity.id（AI 生成回答为 'ai-system'）
 * @property {string} content - 回答正文（Markdown 格式）
 * @property {boolean} isAI - 是否由 AI 生成
 * @property {string[]} [aiSourceAnswerIds] - AI 生成时参考的来源 Answer.id 列表（可选）
 * @property {number} upvotes - 点赞数量
 * @property {AnswerStatus} status - 回答状态
 * @property {number} createdAt - 创建时间（毫秒时间戳）
 * @property {number} updatedAt - 最后更新时间（毫秒时间戳）
 */

/**
 * AI 摘要实体：问题+回答的 AI 生成摘要
 * @typedef {Object} AISummary
 * @property {string} id - UUID v4
 * @property {string} questionId - 所属 Question.id
 * @property {string} content - 摘要内容（Markdown 格式）
 * @property {string[]} sourceAnswerIds - 参与摘要生成的 Answer.id 列表
 * @property {Citation[]} citations - 引用来源列表
 * @property {SummaryStatus} status - 摘要生成状态
 * @property {number} generatedAt - 首次生成时间（毫秒时间戳）
 * @property {number} updatedAt - 最后更新/重新生成时间（毫秒时间戳）
 * @property {{helpful:number, needsUpdate:number, inaccurate:number}} feedbackCount - 反馈统计计数
 */

/**
 * 匿名身份：本地生成的用户标识（无账号体系）
 * @typedef {Object} AnonymousIdentity
 * @property {string} id - UUID v4，身份唯一标识
 * @property {string} nickname - 随机昵称（格式：{形容词}{名词}，如 "活泼的松鼠"）
 * @property {string} avatarSeed - 渐变色头像种子（格式：{color1}|{color2}|{angle}，如 "#5b6cff|#14b585|135"）
 * @property {number} createdAt - 创建时间（毫秒时间戳）
 * @property {number} lastActiveAt - 最后活跃时间（毫秒时间戳）
 */

/**
 * AI 使用统计：AI 功能触发次数的累计数据（内嵌于 BehaviorProfile）
 * @typedef {Object} AIUsageStats
 * @property {number} totalCalls - AI 功能总调用次数
 * @property {Object<AIFeatureType, number>} byFeature - 各功能类型调用次数分布
 * @property {number} lastUsedAt - 最后一次调用时间（毫秒时间戳）
 */

/**
 * 行为画像：本地记录的用户行为信号，用于个性化推荐
 * @typedef {Object} BehaviorProfile
 * @property {string} identityId - 关联 AnonymousIdentity.id
 * @property {Object<string, number>} tagWeights - 标签权重字典（key=标签，value=累计权重）
 * @property {string[]} viewedQuestionIds - 已浏览问题 id 列表
 * @property {string[]} upvotedAnswerIds - 已点赞回答 id 列表
 * @property {string[]} searchHistory - 搜索查询历史
 * @property {AIUsageStats} aiUsageStats - AI 使用统计
 * @property {number} updatedAt - 最后更新时间（毫秒时间戳）
 */

/**
 * 搜索会话：一次搜索行为的完整记录
 * @typedef {Object} SearchSession
 * @property {string} id - UUID v4
 * @property {string} query - 原始搜索词
 * @property {string} semanticQuery - 语义扩展后的搜索查询
 * @property {string} aiSummary - AI 搜索摘要内容
 * @property {Citation[]} citations - 摘要引用来源列表
 * @property {string[]} relatedQuestionIds - 返回的相关问题 id 列表
 * @property {string} identityId - 搜索者 AnonymousIdentity.id
 * @property {number} createdAt - 搜索发起时间（毫秒时间戳）
 */

/**
 * AI 交互记录：单次 AI 功能调用的埋点
 * @typedef {Object} AIInteraction
 * @property {string} id - UUID v4
 * @property {string} identityId - 使用者 AnonymousIdentity.id
 * @property {AIFeatureType} featureType - AI 功能类型
 * @property {string} targetId - 操作目标 id（问题 id / 回答 id 等）
 * @property {number} duration - 调用耗时（毫秒）
 * @property {boolean} success - 是否调用成功
 * @property {string|null} [errorMessage] - 错误信息（失败时，可选）
 * @property {'helpful'|'needs_update'|'inaccurate'} [feedback] - 用户反馈（可选）
 * @property {number} createdAt - 调用时间（毫秒时间戳）
 */

/**
 * 反馈信号：用户对 AI 输出的"有用/无用"反馈
 * @typedef {Object} FeedbackSignal
 * @property {string} id - UUID v4
 * @property {string} identityId - 反馈者 AnonymousIdentity.id
 * @property {string} targetId - 反馈目标 id（AISummary.id 或 Answer.id）
 * @property {'SUMMARY'|'ANSWER'} targetType - 反馈目标类型
 * @property {1|-1} value - 反馈值：1=有用，-1=无用
 * @property {string} [comment] - 可选文字反馈
 * @property {number} createdAt - 反馈时间（毫秒时间戳）
 */
