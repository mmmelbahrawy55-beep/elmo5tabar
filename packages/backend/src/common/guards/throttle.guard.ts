import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected override throwThrottlingException(
    _context: ExecutionContext,
  ): Promise<void> {
    return Promise.reject(
      new ThrottlerException('طلبات كثيرة جداً. يرجى المحاولة مرة أخرى لاحقاً.'),
    );
  }
}
