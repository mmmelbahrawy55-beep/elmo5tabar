import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class AiRateLimitGuard implements CanActivate {
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly limits: Record<string, { maxRequests: number; windowMs: number }>;

  constructor(
    private reflector: Reflector,
    private config: ConfigService,
  ) {
    this.limits = {
      PATIENT: { maxRequests: this.config.get<number>('AI_RATE_LIMIT_PATIENT', 30), windowMs: 60000 },
      DOCTOR: { maxRequests: this.config.get<number>('AI_RATE_LIMIT_DOCTOR', 60), windowMs: 60000 },
      LAB_TECHNICIAN: { maxRequests: this.config.get<number>('AI_RATE_LIMIT_TECH', 60), windowMs: 60000 },
      RECEPTIONIST: { maxRequests: this.config.get<number>('AI_RATE_LIMIT_RECEPTION', 40), windowMs: 60000 },
      ADMIN: { maxRequests: this.config.get<number>('AI_RATE_LIMIT_ADMIN', 100), windowMs: 60000 },
      default: { maxRequests: 20, windowMs: 60000 },
    };
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const role = user?.role || 'default';
    const key = user?.id || request.ip || 'anonymous';

    const limit = this.limits[role] || this.limits.default;
    const now = Date.now();

    let entry = this.store.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + limit.windowMs };
      this.store.set(key, entry);
    }

    entry.count++;
    if (entry.count > limit.maxRequests) {
      throw new HttpException({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'AI rate limit exceeded. Please wait before sending another request.',
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      }, HttpStatus.TOO_MANY_REQUESTS);
    }

    request.aiRateLimit = {
      remaining: Math.max(0, limit.maxRequests - entry.count),
      resetAt: entry.resetAt,
      limit: limit.maxRequests,
    };

    return true;
  }
}
