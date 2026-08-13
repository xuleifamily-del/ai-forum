/**
 * API 客户端：封装 fetch，统一处理 JSON 解析与错误。
 * 所有请求基础路径为 /api（开发环境由 Vite 代理转发到后端）。
 */

import authService from './authService.js';

const BASE_URL = '/api';

async function request(method, path, { body, query } = {}) {
  let url = `${BASE_URL}${path}`;
  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const options = {
    method,
    headers: {},
  };
  if (body !== undefined && body !== null) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const token = authService.getToken();
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw new Error(`网络错误：无法连接到服务器 (${err.message})`);
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || `请求失败 (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

const apiClient = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  del: (path, query) => request('DELETE', path, { query }),
};

export default apiClient;
