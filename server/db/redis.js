import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

let redisClient = null;
let isRedisAvailable = false;

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: false,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });

    redisClient.on('connect', () => {
      console.log('[redis] Connected to Redis.');
    });

    redisClient.on('ready', () => {
      isRedisAvailable = true;
    });

    redisClient.on('reconnecting', (delay) => {
      isRedisAvailable = false;
      console.warn(`[redis] Reconnecting in ${delay}ms...`);
    });

    redisClient.on('end', () => {
      isRedisAvailable = false;
      console.warn('[redis] Connection closed.');
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      console.warn('[redis] Error:', err.message);
    });
  } catch (err) {
    console.warn('[redis] Failed to create client:', err.message);
    redisClient = null;
    isRedisAvailable = false;
  }
} else {
  console.warn(
    '[redis] REDIS_URL is not set. Caching disabled. ' +
      'Set REDIS_URL in the environment to enable Redis caching.'
  );
}

export { redisClient, isRedisAvailable };
