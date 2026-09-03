import Redis from "ioredis";
import config from "../config";

let redis: Redis | null = null;
let enabled = false;

if (config.redis.enabled && config.redis.url) {
  redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  });
  redis.on("error", () => {
    /* connection errors are handled gracefully */
  });
  enabled = true;
}

export const getRedis = (): Redis | null => redis;

export const redisEnabled = (): boolean => enabled;

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!redis || !enabled) return null;
  try {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (
  key: string,
  value: unknown,
  ttlSeconds = 300,
): Promise<void> => {
  if (!redis || !enabled) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* ignore cache failures */
  }
};

export const cacheDel = async (pattern: string): Promise<void> => {
  if (!redis || !enabled) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    /* ignore cache failures */
  }
};

export const closeRedis = async (): Promise<void> => {
  if (redis) {
    try {
      await redis.quit();
    } catch {
      /* ignore */
    }
  }
};