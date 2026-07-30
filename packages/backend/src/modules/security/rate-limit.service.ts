import { Injectable, Logger } from '@nestjs/common';

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

const DEFAULT_LIMITS: Record<string, { limit: number; windowSeconds: number }> = {
  login: { limit: 5, windowSeconds: 900 },
  register: { limit: 3, windowSeconds: 3600 },
  otp: { limit: 5, windowSeconds: 300 },
  password_reset: { limit: 3, windowSeconds: 3600 },
  api: { limit: 1000, windowSeconds: 3600 },
  refresh: { limit: 30, windowSeconds: 60 },
};

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  private getKey(identifier: string, action: string): string {
    return `ratelimit:${action}:${identifier}`;
  }

  async check(
    identifier: string,
    action: string,
    limit: number,
    windowSeconds: number,
  ): Promise<RateLimitResult> {
    const key = this.getKey(identifier, action);
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    let entry = this.store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(key, entry);
    }

    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    const remaining = Math.max(0, limit - entry.timestamps.length);
    const resetAt = new Date(now + windowSeconds * 1000);

    return {
      allowed: entry.timestamps.length < limit,
      remaining,
      resetAt,
    };
  }

  async increment(
    identifier: string,
    action: string,
    windowSeconds: number,
  ): Promise<{ count: number; resetAt: Date }> {
    const key = this.getKey(identifier, action);
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    let entry = this.store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(key, entry);
    }

    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
    entry.timestamps.push(now);

    const resetAt = new Date(now + windowSeconds * 1000);

    return { count: entry.timestamps.length, resetAt };
  }

  async reset(identifier: string, action: string): Promise<void> {
    const key = this.getKey(identifier, action);
    this.store.delete(key);
  }

  async getRemaining(
    identifier: string,
    action: string,
    limit: number,
  ): Promise<{ remaining: number; resetAt: Date }> {
    const defaults = DEFAULT_LIMITS[action];
    const windowSeconds = defaults?.windowSeconds || 3600;
    const key = this.getKey(identifier, action);
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const entry = this.store.get(key);
    if (!entry) {
      return { remaining: limit, resetAt: new Date(now + windowSeconds * 1000) };
    }

    const validTimestamps = entry.timestamps.filter((ts) => ts > windowStart);
    const remaining = Math.max(0, limit - validTimestamps.length);
    const resetAt = validTimestamps.length > 0
      ? new Date(validTimestamps[0] + windowSeconds * 1000)
      : new Date(now + windowSeconds * 1000);

    return { remaining, resetAt };
  }

  getDefaultLimits(): Record<string, { limit: number; windowSeconds: number }> {
    return { ...DEFAULT_LIMITS };
  }

  async checkWithDefaults(identifier: string, action: string): Promise<RateLimitResult> {
    const defaults = DEFAULT_LIMITS[action];
    if (!defaults) {
      this.logger.warn(`No default rate limit found for action: ${action}`);
      return { allowed: true, remaining: 999, resetAt: new Date(Date.now() + 3600_000) };
    }
    return this.check(identifier, action, defaults.limit, defaults.windowSeconds);
  }

  async incrementWithDefaults(
    identifier: string,
    action: string,
  ): Promise<{ count: number; resetAt: Date; blocked: boolean }> {
    const defaults = DEFAULT_LIMITS[action];
    if (!defaults) {
      return { count: 0, resetAt: new Date(), blocked: false };
    }

    const { count, resetAt } = await this.increment(identifier, action, defaults.windowSeconds);
    return { count, resetAt, blocked: count >= defaults.limit };
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      const action = key.split(':')[1];
      const defaults = DEFAULT_LIMITS[action];
      const windowSeconds = defaults?.windowSeconds || 3600;
      const windowStart = now - windowSeconds * 1000;

      entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

      if (entry.timestamps.length === 0) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} empty rate limit entries`);
    }
  }

  onDestroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
