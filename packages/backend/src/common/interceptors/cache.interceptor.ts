import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject, Logger } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export const CACHE_KEY = 'cache_key';
export const CACHE_TTL = 'cache_ttl';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const key = this.reflector.get<string>(CACHE_KEY, context.getHandler());
    if (!key) return next.handle();

    const ttl = this.reflector.get<number>(CACHE_TTL, context.getHandler()) ?? 300;
    const request = context.switchToHttp().getRequest();
    const cacheKey = `${key}:${request.url}`;

    try {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return of(cached);
      }
    } catch (err) {
      this.logger.warn(`Cache get failed: ${err}`);
    }

    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.cache.set(cacheKey, data, ttl);
        } catch (err) {
          this.logger.warn(`Cache set failed: ${err}`);
        }
      }),
    );
  }
}

export function UseCache(key: string, ttl = 300) {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_KEY, key, descriptor.value);
    Reflect.defineMetadata(CACHE_TTL, ttl, descriptor.value);
    return descriptor;
  };
}
