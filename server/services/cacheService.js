import { redisClient, isRedisAvailable } from '../db/redis.js';

/**
 * 缓存服务：所有方法 try/catch 静默降级，Redis 不可用时直查 PG。
 * 所有 key 自动加 `aiforum:` 前缀，避免与其他服务冲突。
 */
const PREFIX = 'aiforum:';

function prefixed(key) {
  return `${PREFIX}${key}`;
}

/**
 * 读取缓存。返回反序列化对象或 null（miss / 不可用 / 出错）。
 */
async function get(key) {
  if (!isRedisAvailable || !redisClient) return null;
  try {
    const raw = await redisClient.get(prefixed(key));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[cache] get failed:', err.message);
    return null;
  }
}

/**
 * 写入缓存（带 TTL，秒）。
 */
async function set(key, value, ttlSeconds) {
  if (!isRedisAvailable || !redisClient) return;
  try {
    const raw = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await redisClient.set(prefixed(key), raw, 'EX', ttlSeconds);
    } else {
      await redisClient.set(prefixed(key), raw);
    }
  } catch (err) {
    console.warn('[cache] set failed:', err.message);
  }
}

/**
 * 删除单个 key。
 */
async function del(key) {
  if (!isRedisAvailable || !redisClient) return;
  try {
    await redisClient.del(prefixed(key));
  } catch (err) {
    console.warn('[cache] del failed:', err.message);
  }
}

/**
 * 按模式删除（如 'qlist:*'）。用 SCAN 迭代，避免 KEYS 阻塞。
 */
async function delByPattern(pattern) {
  if (!isRedisAvailable || !redisClient) return;
  try {
    const fullPattern = prefixed(pattern);
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redisClient.scan(
        cursor,
        'MATCH',
        fullPattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } while (cursor !== '0');
  } catch (err) {
    console.warn('[cache] delByPattern failed:', err.message);
  }
}

export default { get, set, del, delByPattern };
