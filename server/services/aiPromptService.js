/**
 * AI 提示词构建服务。
 *
 * 每个 builder 返回 `[{ role, content }]` 数组，可直接传给 deepseekService.chat。
 * 系统提示要求模型直接输出结果，不加前缀或解释。
 */

const POLISH_SYSTEM =
  '你是技术问答社区的内容编辑助手，负责将用户模糊的表述润色为清晰、专业的问题标题/正文，保留原意，补充必要的技术细节，去除口语化冗余。直接输出润色后的文本，不要加任何前缀或解释。'

const EXPAND_SYSTEM =
  '你是技术问答社区的内容扩写助手。基于问题标题和已有正文，补充必要的背景、复现步骤、已尝试方案与期望结果，使问题更易被回答。直接输出扩写后的 Markdown 正文，不要加任何前缀或解释。'

const ANSWER_SYSTEM =
  '你是技术问答社区的 AI 回答助手。请基于问题标题与正文给出专业、清晰的回答。回答使用 Markdown 格式，可包含代码块、列表。如果有相关回答作为参考，可综合但不要直接复制。'

const SUMMARY_SYSTEM_BASE =
  '你是资深技术社区内容编辑，仅根据「提供的已有回答」综合摘要。' +
  '规则 1：只使用下方提供的回答内容，禁止臆造未提供的任何信息。若信息不足，直接写「现有回答未覆盖此点」。' +
  '规则 2：每个要点必须在句末以 `[N]` 格式标注引用来源。N 为回答编号（从 1 开始）。' +
  '规则 3：可同一要点多引用：「结论 X [1][3]」。' +
  '规则 4：输出结构：先一行总览（不超过 50 字），然后 3-5 条要点的项目符号列表（`- ` 开头），每条含 1+ 引用。' +
  '规则 5：输出为纯 Markdown，不要任何代码块围栏、不要额外说明、不要「以下是摘要」等前缀。'

const SEARCH_REWRITE_SYSTEM =
  '你是技术搜索查询改写引擎。将用户原始查询改写为标准化的、可匹配技术文档和论坛帖的专业术语。输出严格 JSON 格式，不要额外文字：{ "rewritten": string, "keywords": string[] }' +
  'rewritten 规则：同义词替换（如"跑两次"→"重复执行"，"死循环"→"infinite loop"，"挂了"→"服务崩溃/5xx"），中英文统一大小写，补全隐含上下文（如"effect" → "React useEffect"），错别字简单纠正。' +
  'keywords 数组：抽取出核心关键词/标签，用于反向 RAG 标签匹配，约 3~8 个词。'

const SEARCH_SUMMARY_SYSTEM =
  '你是技术社区 AI 搜索助手。根据下方提供的相关帖子内容为用户的查询生成 3~5 条要点式答案摘要。每条要点末尾必须以 `[N]` 格式标注引用来源帖子的编号（topQuestions 的顺序，topQuestions[0] = [1]）。输出 Markdown 项目符号列表，不要额外前缀说明。只使用提供帖子中的事实，禁止臆造。信息不足时写「现有帖子未覆盖该查询的明确结论」。'

/**
 * 规范化单条回答为字符串上下文。
 */
function answerToText(answer) {
  if (answer == null) return ''
  if (typeof answer === 'string') return answer
  if (typeof answer === 'object') {
    return answer.content || answer.text || answer.body || ''
  }
  return String(answer)
}

/**
 * 润色标题/正文。
 * @param {Object} p
 * @param {'title'|'body'} p.type
 * @param {string} p.text
 * @param {string} [p.context]
 * @returns {Array<{role:string,content:string}>}
 */
function buildPolishMessages({ type, text, context }) {
  const label = type === 'body' ? '正文' : '标题'
  let user = `请润色以下问题${label}，使其更清晰、专业：\n\n${text || ''}`
  if (context && context.trim()) {
    user += `\n\n补充上下文：\n${context.trim()}`
  }
  return [
    { role: 'system', content: POLISH_SYSTEM },
    { role: 'user', content: user },
  ]
}

/**
 * 扩写问题正文。
 * @param {Object} p
 * @param {string} p.title
 * @param {string} p.body
 * @returns {Array<{role:string,content:string}>}
 */
function buildExpandMessages({ title, body }) {
  const user =
    `问题标题：${title || ''}\n\n` +
    `已有正文：\n${body || ''}\n\n` +
    `请基于以上信息扩写正文，补充背景、复现步骤、已尝试方案与期望结果。`
  return [
    { role: 'system', content: EXPAND_SYSTEM },
    { role: 'user', content: user },
  ]
}

/**
 * 生成提问/回答草稿。
 * @param {Object} p
 * @param {'question'|'answer'} p.intent
 * @param {string} [p.title]
 * @param {string} [p.body]
 * @returns {Array<{role:string,content:string}>}
 */
function buildDraftMessages({ intent, title, body }) {
  if (intent === 'answer') {
    const system =
      '你是技术问答社区的内容草稿助手。请基于问题标题与正文，生成一份结构化的回答草稿，' +
      '包含：背景、方案、代码示例、注意事项。使用 Markdown 格式。' +
      '在回答末尾另起一行追加：“\\n\\n> 此为 AI 草稿，请根据实际情况修改。”。' +
      '不要加任何额外的前缀或解释。'
    const user =
      `问题标题：${title || ''}\n\n` +
      `问题正文：\n${body || ''}\n\n` +
      `请生成结构化回答草稿（背景→方案→代码示例→注意事项）。`
    return [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]
  }

  // 默认 question
  const system =
    '你是技术问答社区的内容草稿助手。请基于给定的主题，生成一份结构化的提问草稿，' +
    '包含：背景、现象、已尝试、期望。使用 Markdown 格式。直接输出草稿，不要加任何前缀或解释。'
  const user =
    `主题：${title || ''}\n` +
    `补充信息：\n${body || ''}\n\n` +
    `请生成结构化提问草稿（背景→现象→已尝试→期望）。`
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

/**
 * 生成 AI 回答。
 * @param {Object} p
 * @param {string} [p.questionId]
 * @param {string} p.title
 * @param {string} p.body
 * @param {Array<string|{content:string}>} [p.topAnswers]
 * @returns {Array<{role:string,content:string}>}
 */
function buildAnswerMessages({ questionId, title, body, topAnswers }) {
  let user = `问题标题：${title || ''}\n\n问题正文：\n${body || ''}`
  const refs = Array.isArray(topAnswers)
    ? topAnswers.map(answerToText).filter((t) => t && t.trim())
    : []
  if (refs.length > 0) {
    user +=
      '\n\n相关回答（可综合参考，但不要直接复制）：\n' +
      refs.map((t, i) => `--- 参考 ${i + 1} ---\n${t}`).join('\n')
  }
  return [
    { role: 'system', content: ANSWER_SYSTEM },
    { role: 'user', content: user },
  ]
}

function truncate(str, max) {
  if (!str) return ''
  const s = typeof str === 'string' ? str : String(str)
  return s.length > max ? s.slice(0, max) : s
}

/**
 * 构建 AI 摘要的 Prompt。
 * @param {Object} p
 * @param {string} p.title
 * @param {string} p.body
 * @param {Array<{id:string,content:string,author?:string}>} [p.topAnswers]
 * @returns {Array<{role:string,content:string}>}
 */
function buildSummaryMessages({ title, body, topAnswers }) {
  const hasAnswers = Array.isArray(topAnswers) && topAnswers.length > 0
  const systemContent = hasAnswers
    ? SUMMARY_SYSTEM_BASE
    : SUMMARY_SYSTEM_BASE + ' 暂无回答，请提示用户等待社区补充。'

  let user = `标题：${title || ''}\n`
  user += `问题补充：${truncate(body, 600)}\n`

  if (hasAnswers) {
    user += '\n现有回答列表：\n'
    topAnswers.forEach((ans, idx) => {
      const n = idx + 1
      const author = ans?.author || '匿名用户'
      const content = truncate(answerToText(ans), 800)
      user += `[${n}] ${author}\n${content}\n\n`
    })
  }

  return [
    { role: 'system', content: systemContent },
    { role: 'user', content: user },
  ]
}

/**
 * 构建搜索查询改写的 Prompt。
 * @param {Object} p
 * @param {string} p.query
 * @returns {Array<{role:string,content:string}>}
 */
function buildSearchRewriteMessages(query) {
  return [
    { role: 'system', content: SEARCH_REWRITE_SYSTEM },
    { role: 'user', content: query || '' },
  ]
}

/**
 * 构建搜索摘要的 Prompt。
 * @param {Object} p
 * @param {string} p.query
 * @param {string} p.rewritten
 * @param {Array<{id:string,title:string,excerpt:string,tags?:string[]}>} p.topQuestions
 * @returns {Array<{role:string,content:string}>}
 */
function buildSearchSummaryMessages({ query, rewritten, topQuestions }) {
  const safeQuestions = Array.isArray(topQuestions) ? topQuestions : []
  let user = `用户原始查询：${query || ''}\n`
  user += `改写后查询：${rewritten || query || ''}\n\n`

  if (safeQuestions.length === 0) {
    user += '暂无相关帖子。'
  } else {
    user += '相关帖子列表：\n'
    safeQuestions.forEach((q, idx) => {
      const n = idx + 1
      const title = q?.title || '(无标题)'
      const excerpt = truncate(q?.excerpt || '', 500)
      const tags = Array.isArray(q?.tags) ? q.tags.join('、') : ''
      user += `[${n}] ${title}\n`
      if (tags) user += `标签：${tags}\n`
      user += `摘要：${excerpt}\n\n`
    })
  }

  return [
    { role: 'system', content: SEARCH_SUMMARY_SYSTEM },
    { role: 'user', content: user },
  ]
}

export {
  buildPolishMessages,
  buildExpandMessages,
  buildDraftMessages,
  buildAnswerMessages,
  buildSummaryMessages,
  buildSearchRewriteMessages,
  buildSearchSummaryMessages,
}
