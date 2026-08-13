import { STORAGE_KEYS } from '../constants/forumStorageKeys.js';
import StorageService from './storageService.js';

const TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN;

function getToken() {
  return StorageService.get(TOKEN_KEY);
}

function setToken(token) {
  StorageService.set(TOKEN_KEY, token);
}

function removeToken() {
  StorageService.remove(TOKEN_KEY);
}

async function register(username, password) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '注册失败');
  setToken(data.token);
  return data;
}

async function login(username, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '登录失败');
  setToken(data.token);
  return data;
}

export default { register, login, getToken, setToken, removeToken };
