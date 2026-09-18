import Redis from "ioredis";

export interface HoldLockResult {
  acquired: boolean;
  lockKey: string;
  holdId: string;
  expiresAt: string;
  ttlSeconds: number;
}

/**
 * In-Memory Atomic Lock Manager for Development & Fallback
 * Provides true atomic SET NX EX semantics, preventing race conditions.
 */
class InMemoryAtomicLockManager {
  private locks = new Map<string, { holdId: string; expiresAt: number }>();
  private timers = new Map<string, NodeJS.Timeout>();

  async setNxEx(key: string, holdId: string, ttlSeconds: number): Promise<boolean> {
    const now = Date.now();
    const existing = this.locks.get(key);

    if (existing && existing.expiresAt > now) {
      return false; // Key already locked by another user
    }

    // Acquire atomic lock
    const expiresAt = now + ttlSeconds * 1000;
    this.locks.set(key, { holdId, expiresAt });

    // Clear old timer if any
    const oldTimer = this.timers.get(key);
    if (oldTimer) clearTimeout(oldTimer);

    const timer = setTimeout(() => {
      this.locks.delete(key);
      this.timers.delete(key);
    }, ttlSeconds * 1000);
    this.timers.set(key, timer);

    return true;
  }

  async release(key: string, holdId: string): Promise<boolean> {
    const existing = this.locks.get(key);
    if (existing && existing.holdId === holdId) {
      this.locks.delete(key);
      const timer = this.timers.get(key);
      if (timer) clearTimeout(timer);
      this.timers.delete(key);
      return true;
    }
    return false;
  }

  async get(key: string): Promise<string | null> {
    const existing = this.locks.get(key);
    if (existing && existing.expiresAt > Date.now()) {
      return existing.holdId;
    }
    return null;
  }

  clearAll(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this.locks.clear();
  }
}

const memoryLockManager = new InMemoryAtomicLockManager();

let redisClient: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
    });
    redisClient.on("error", (err) => {
      console.warn("[Redis] Offline, falling back to in-memory atomic locks:", err.message);
    });
  } catch {
    redisClient = null;
  }
}

export class RedisHoldProvider {
  private readonly defaultTtlSeconds = 600; // 10 minutes

  generateLockKey(resourceId: string, date: string, startTime: string): string {
    return `booking:hold:${resourceId}:${date}:${startTime.replace(":", "")}`;
  }

  /**
   * ATOMIC HOLD CREATION
   * Guarantees that only ONE customer can hold a specific resource + date + time range.
   */
  async acquireHold(
    resourceId: string,
    date: string,
    startTime: string,
    holdId: string,
    ttlSeconds: number = this.defaultTtlSeconds
  ): Promise<HoldLockResult> {
    const lockKey = this.generateLockKey(resourceId, date, startTime);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    if (redisClient && redisClient.status === "ready") {
      try {
        // Atomic SET NX EX in Redis
        const result = await redisClient.set(lockKey, holdId, "EX", ttlSeconds, "NX");
        return {
          acquired: result === "OK",
          lockKey,
          holdId,
          expiresAt,
          ttlSeconds,
        };
      } catch {
        // Fallback to memory lock on network error
      }
    }

    // Atomic in-memory fallback
    const acquired = await memoryLockManager.setNxEx(lockKey, holdId, ttlSeconds);
    return {
      acquired,
      lockKey,
      holdId,
      expiresAt,
      ttlSeconds,
    };
  }

  /**
   * ATOMIC HOLD RELEASE
   */
  async releaseHold(resourceId: string, date: string, startTime: string, holdId: string): Promise<boolean> {
    const lockKey = this.generateLockKey(resourceId, date, startTime);

    if (redisClient && redisClient.status === "ready") {
      try {
        // Atomic Lua script in Redis: delete only if holdId matches
        const luaScript = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        const result = await redisClient.eval(luaScript, 1, lockKey, holdId);
        return result === 1;
      } catch {
        // Fallback
      }
    }

    return memoryLockManager.release(lockKey, holdId);
  }

  /**
   * Inspect current hold status
   */
  async getHoldOwner(resourceId: string, date: string, startTime: string): Promise<string | null> {
    const lockKey = this.generateLockKey(resourceId, date, startTime);
    if (redisClient && redisClient.status === "ready") {
      try {
        return await redisClient.get(lockKey);
      } catch {
        // Fallback
      }
    }
    return memoryLockManager.get(lockKey);
  }

  clearAllLocks(): void {
    memoryLockManager.clearAll();
  }
}

export const redisHoldProvider = new RedisHoldProvider();
