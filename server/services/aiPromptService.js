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

export {
  buildPolishMessages,
  buildExpandMessages,
  buildDraftMessages,
  buildAnswerMessages,
}
