/**
 * AI 服务：封装 AI 相关 API 调用（润色 / 扩写 / 草稿 / 流式回答）。
 * 非流式接口走 apiClient，流式接口使用原生 fetch + ReadableStream + TextDecoder。
 */
import apiClient from './apiClient.js';

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
