/**
 * DeepSeek LLM 代理服务（OpenAI 兼容接口）。
 *
 * 安全约束：API key 仅从 process.env.DEEPSEEK_API_KEY 读取，严禁硬编码或日志输出。
 * 失败兜底：缺 key / 网络错误 / 4xx/5xx / 超时 → 返回确定性 mock 模板，标注「模拟回复（离线演示）」。
 */

const BASE_URL = 'https://api.deepseek.com'
const CHAT_ENDPOINT = '/chat/completions'
const DEFAULT_MODEL = 'deepseek-v4-pro'
const DEFAULT_TIMEOUT_MS = 30000

const MOCK_PREFIX = '「模拟回复（离线演示）」\n\n'

/**
 * AI 是否可用（仅取决于 DEEPSEEK_API_KEY 是否配置）。
 */
function isAiAvailable() {
  return !!process.env.DEEPSEEK_API_KEY
}

/**
 * 将外部 signal 关联到本地 AbortController，返回取消关联函数。
 * 兼容 Node 18（不依赖 AbortSignal.any）。
 */
function linkExternalSignal(controller, externalSignal) {
  if (!externalSignal) return () => {}
  if (externalSignal.aborted) {
    controller.abort()
    return () => {}
  }
  const onAbort = () => controller.abort()
  externalSignal.addEventListener('abort', onAbort, { once: true })
  return () => externalSignal.removeEventListener('abort', onAbort)
}

/**
 * 调用 DeepSeek chat completions。
 *
 * @param {Object} opts
 * @param {Array<{role:string,content:string}>} opts.messages 对话消息。
 * @param {string} [opts.model] 模型名，默认 deepseek-v4-pro。
 * @param {boolean} [opts.stream] 是否流式。
 * @param {AbortSignal} [opts.signal] 外部取消信号。
 * @param {number} [opts.timeoutMs] 超时毫秒，默认 30000。
 * @param {string} [opts.engine] 兜底 mock 使用的引擎名（见 getMockResponse）。
 * @param {Object} [opts.mockParams] 兜底 mock 使用的参数。
 * @returns 非流式：`{ text, mock }`；流式：异步生成器，产出 `{ delta, mock, done }`。
 */
async function chat({
  messages,
  model,
  stream,
  signal,
  timeoutMs,
  engine,
  mockParams,
}) {
  const useStream = !!stream
  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    const mockText = getMockResponse(engine, mockParams)
    if (useStream) {
      return mockStream(mockText)
    }
    return { text: mockText, mock: true }
  }

  const controller = new AbortController()
  const unlink = linkExternalSignal(controller, signal)
  const timer =
    timeoutMs && timeoutMs > 0
      ? setTimeout(
          () => controller.abort(new Error('deepseek request timeout')),
          timeoutMs
        )
      : null

  try {
    const response = await fetch(BASE_URL + CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        messages,
        stream: useStream,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      console.error(`[deepseek] chat failed: ${response.status}`)
      const mockText = getMockResponse(engine, mockParams)
      if (useStream) {
        return mockStream(mockText)
      }
      return { text: mockText, mock: true }
    }

    if (useStream) {
      return streamFromResponse(response, engine, mockParams)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (content) {
      return { text: content, mock: false }
    }
    return { text: getMockResponse(engine, mockParams), mock: true }
  } catch (err) {
    const aborted = err?.name === 'AbortError'
    console.error(
      aborted
        ? `[deepseek] chat error: timeout or aborted`
        : `[deepseek] chat error: ${err?.message || 'unknown'}`
    )
    const mockText = getMockResponse(engine, mockParams)
    if (useStream) {
      return mockStream(mockText)
    }
    return { text: mockText, mock: true }
  } finally {
    if (timer) clearTimeout(timer)
    unlink()
  }
}

/**
 * 构造一个只产出 mock 内容的异步生成器（用于流式兜底）。
 */
async function* mockStream(mockText) {
  yield { delta: mockText, mock: true, done: false }
  yield { delta: '', mock: true, done: true }
}

/**
 * 从已就绪的 SSE 响应流中解析 delta。
 * 若在产出真实内容前发生错误，回退为单条 mock + done。
 */
async function* streamFromResponse(response, engine, mockParams) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let yieldedReal = false

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line || !line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (payload === '[DONE]') {
          yield { delta: '', mock: false, done: true }
          return
        }
        let parsed
        try {
          parsed = JSON.parse(payload)
        } catch {
          continue
        }
        const delta = parsed?.choices?.[0]?.delta?.content
        if (delta) {
          yieldedReal = true
          yield { delta, mock: false, done: false }
        }
      }
    }
    yield { delta: '', mock: false, done: true }
  } catch (err) {
    console.error(`[deepseek] stream error: ${err?.message || 'unknown'}`)
    if (!yieldedReal) {
      const mockText = getMockResponse(engine, mockParams)
      yield { delta: mockText, mock: true, done: false }
    }
    yield { delta: '', mock: true, done: true }
  } finally {
    try {
      reader.releaseLock()
    } catch {
      /* ignore */
    }
  }
}

/**
 * 生成确定性 mock 模板（按引擎）。所有模板以「模拟回复（离线演示）」前缀。
 *
 * @param {string} engine 引擎名：polish-title / polish-body / expand / draft-question / draft-answer / answer
 * @param {Object} [params] 模板参数（text / title / body 等）。
 * @returns {string}
 */
function getMockResponse(engine, params = {}) {
  switch (engine) {
    case 'polish-title': {
      const raw = (params.text || '').trim() || '如何解决这个问题？'
      return MOCK_PREFIX + raw
    }
    case 'polish-body': {
      const raw = (params.text || '').trim() || '（请补充问题描述）'
      return MOCK_PREFIX + raw
    }
    case 'expand': {
      const title = (params.title || '').trim() || '待扩写的问题'
      const body = (params.body || '').trim() || '（暂无正文）'
      return (
        MOCK_PREFIX +
        `**背景**\n${title}：${body}\n\n` +
        `**复现步骤**\n1. （请补充触发该问题的具体操作步骤）\n2. \n\n` +
        `**已尝试方案**\n- （请补充已尝试过的解决方法及结果）\n\n` +
        `**期望结果**\n（请补充期望达到的目标或行为）`
      )
    }
    case 'draft-question': {
      const title = (params.title || '').trim() || '待提问主题'
      return (
        MOCK_PREFIX +
        `**背景**\n在使用 ${title} 相关技术时遇到如下问题。\n\n` +
        `**现象**\n（描述观察到的具体现象与报错信息）\n\n` +
        `**已尝试**\n（列出已尝试的排查与解决方案）\n\n` +
        `**期望**\n（描述期望得到的帮助或最终目标）`
      )
    }
    case 'draft-answer': {
      const title = (params.title || '').trim() || '该问题'
      return (
        MOCK_PREFIX +
        `**背景**\n针对「${title}」，可从如下思路入手。\n\n` +
        `**方案**\n1. 先确认问题复现环境与版本。\n2. 检查相关配置与依赖是否正确加载。\n3. 根据报错信息定位到具体代码位置。\n\n` +
        '```js\n// 示例代码\nconsole.log("hello world");\n```\n\n' +
        `**注意事项**\n- 请根据实际堆栈信息调整排查方向。\n\n` +
        '> 此为 AI 草稿，请根据实际情况修改。'
      )
    }
    case 'answer': {
      const title = (params.title || '').trim() || '该问题'
      return (
        MOCK_PREFIX +
        `针对「${title}」，以下是参考思路：\n\n` +
        '1. **确认环境与版本**：核对运行环境、依赖版本与配置是否一致。\n' +
        '2. **复现并定位**：稳定复现问题后，根据报错堆栈定位到具体代码。\n' +
        '3. **排查常见原因**：检查数据流、异步时序、空值与边界条件。\n\n' +
        '```js\n// 示例：打印关键变量辅助定位\nconsole.log("debug:", variable);\n```\n\n' +
        '> 以上为离线演示内容，连接 DeepSeek 后将获得针对该问题的实时回答。'
      )
    }
    case 'summary': {
      const topAnswers = Array.isArray(params.topAnswers) ? params.topAnswers : []
      if (topAnswers.length === 0) {
        return MOCK_PREFIX + '暂无社区回答覆盖，建议等待其他用户补充或在其他平台搜索相关资料。'
      }
      const count = topAnswers.length
      const t = (params.title || '').trim()
      const headline = t
        ? `综合已有 ${count} 条回答，「${t}」的核心要点如下：`
        : `综合已有 ${count} 条回答，核心要点如下：`
      const samplePoints = [
        '首先检查是否 React 18 StrictMode 开发环境双重触发 [1]',
        '其次确认依赖数组是否包含对象/数组字面量导致引用变化 [2]',
        '若依赖包含函数，用 useCallback 包一层稳定引用 [1][3]',
        '排查外部事件监听未清理导致副作用重复执行 [2]',
      ]
      const usedPoints = samplePoints.slice(0, Math.min(count + 1, samplePoints.length))
      return MOCK_PREFIX + headline + '\n' + usedPoints.map(p => `- ${p}`).join('\n')
    }
    case 'search-rewrite': {
      const q = (params.query || '').trim() || '搜索'
      const lowerQ = q.toLowerCase()
      let rewritten = q
      let keywords = []
      if (lowerQ.includes('useeffect') || lowerQ.includes('effect')) {
        if (lowerQ.includes('跑两次') || lowerQ.includes('两次') || lowerQ.includes('重复')) {
          rewritten = 'React useEffect 重复执行、StrictMode 开发环境双重调用'
          keywords = ['React', 'useEffect', '重复执行', 'StrictMode']
        } else if (lowerQ.includes('死循环') || lowerQ.includes('无限')) {
          rewritten = 'React useEffect infinite loop、依赖数组不稳定导致无限循环'
          keywords = ['React', 'useEffect', 'infinite loop', '依赖数组']
        } else {
          rewritten = 'React useEffect 副作用钩子使用与排错'
          keywords = ['React', 'useEffect', 'Hooks', '副作用']
        }
      } else if (lowerQ.includes('挂了') || lowerQ.includes('崩溃') || lowerQ.includes('5xx') || lowerQ.includes('服务')) {
        rewritten = '服务崩溃、5xx 服务端错误排查与定位'
        keywords = ['服务崩溃', '5xx', '排查', '服务端错误']
      } else if (lowerQ.includes('死循环')) {
        rewritten = 'infinite loop 无限循环、死循环排查方法'
        keywords = ['infinite loop', '死循环', '排查']
      } else if (lowerQ.includes('跑两次') || lowerQ.includes('两次') || lowerQ.includes('重复执行')) {
        rewritten = '重复执行、双重调用原因排查'
        keywords = ['重复执行', '双重调用', '排查']
      } else {
        const words = q.split(/\s+/).filter(Boolean)
        rewritten = q
        keywords = words.length > 0 ? words.slice(0, 5) : [q]
      }
      return JSON.stringify({ rewritten, keywords })
    }
    case 'search-summary': {
      const questions = Array.isArray(params.topQuestions) ? params.topQuestions : []
      const q = (params.query || '').trim() || '该查询'
      const rw = (params.rewritten || q).trim()
      if (questions.length === 0) {
        return MOCK_PREFIX + '现有帖子未覆盖该查询的明确结论。建议尝试更通用的关键词，或换一种表述方式搜索。'
      }
      const count = questions.length
      const headline = `基于 ${count} 条相关帖子，关于「${rw || q}」的要点如下：`
      const genericPoints = [
        `帖子中提到该问题的常见原因与背景说明 [1]`,
        `社区给出的具体排查步骤与诊断方法 [2]`,
        `可落地的解决方案与代码示例 [3]`,
        `需要注意的边界条件与常见坑点 [1][2]`,
        `后续延伸阅读与参考资料推荐 [${Math.min(count, 4)}]`,
      ]
      const usedCount = Math.min(count, 5)
      const usedPoints = genericPoints.slice(0, Math.max(3, usedCount))
      const adjustedPoints = usedPoints.map((p, i) => {
        const safeIdx = Math.min(i + 1, count)
        return p.replace(/\[\d+\]/g, () => `[${safeIdx}]`)
      })
      return MOCK_PREFIX + headline + '\n' + adjustedPoints.map(p => `- ${p}`).join('\n')
    }
    default: {
      return (
        MOCK_PREFIX +
        '（当前为离线演示模式，AI 服务暂不可用。配置 DEEPSEEK_API_KEY 后即可获得真实回复。）'
      )
    }
  }
}

export {
  isAiAvailable,
  chat,
  getMockResponse,
  BASE_URL as DEEPSEEK_BASE_URL,
  DEFAULT_MODEL as DEEPSEEK_DEFAULT_MODEL,
}
