import {
  HttpException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import type { ApiResponse, PaginationMeta } from '../interfaces/api-response.interface';

export function success<T>(
  data: T,
  message?: string,
  pagination?: PaginationMeta,
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    pagination,
  };
}

export function error(
  code: string,
  message: string,
  messageAr?: string,
  details?: Record<string, unknown> | string,
): never {
  throw new HttpException(
    {
      success: false,
      error: {
        code,
        message,
        messageAr: messageAr ?? message,
        details,
      },
    },
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}

export function notFound(message = 'Resource not found', messageAr = 'لم يتم العثور على المورد'): NotFoundException {
  return new NotFoundException({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message,
      messageAr,
    },
  });
}

export function conflict(message = 'Resource already exists', messageAr = 'المورد موجود بالفعل'): ConflictException {
  return new ConflictException({
    success: false,
    error: {
      code: 'CONFLICT',
      message,
      messageAr,
    },
  });
}

export function forbidden(message = 'Access denied', messageAr = 'تم رفض الوصول'): ForbiddenException {
  return new ForbiddenException({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message,
      messageAr,
    },
  });
}

export function unauthorized(message = 'Unauthorized', messageAr = 'غير مصرح'): UnauthorizedException {
  return new UnauthorizedException({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message,
      messageAr,
    },
  });
}
