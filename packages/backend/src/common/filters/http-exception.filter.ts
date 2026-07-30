import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface PrismaError {
  code: string;
  meta?: Record<string, unknown>;
  message: string;
}

const PRISMA_ERROR_MAP: Record<string, { status: number; message: string; messageAr: string }> = {
  P2002: {
    status: HttpStatus.CONFLICT,
    message: 'A record with this value already exists',
    messageAr: 'يوجد سجل بهذا القيمة بالفعل',
  },
  P2025: {
    status: HttpStatus.NOT_FOUND,
    message: 'Record not found',
    messageAr: 'لم يتم العثور على السجل',
  },
  P2003: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Foreign key constraint failed',
    messageAr: 'فشل قيد المفتاح الأجنبي',
  },
  P2014: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Required relation violation',
    messageAr: 'خرق العلاقة المطلوبة',
  },
  P2011: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Null constraint violation',
    messageAr: 'خرق قيد الفراغ',
  },
};

const logger = new Logger('HttpExceptionFilter');

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let messageAr = 'حدث خطأ غير متوقع';
    let details: Record<string, unknown> | string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'object' && exResponse !== null) {
        const exObj = exResponse as Record<string, unknown>;
        const errorField = exObj['error'] as Record<string, unknown> | string | undefined;

        if (errorField && typeof errorField === 'object') {
          code = (errorField['code'] as string) ?? code;
          message = (errorField['message'] as string) ?? exception.message;
          messageAr = (errorField['messageAr'] as string) ?? messageAr;
          details = errorField['details'] as Record<string, unknown> | string | undefined;
        } else {
          message = (exObj['message'] as string) ?? exception.message;
          messageAr = (exObj['messageAr'] as string) ?? messageAr;
          code = mapStatusToCode(status);
        }
      } else {
        message = String(exResponse);
        messageAr = message;
        code = mapStatusToCode(status);
      }
    } else if (isPrismaError(exception)) {
      const mapped = PRISMA_ERROR_MAP[exception.code];
      if (mapped) {
        status = mapped.status;
        message = mapped.message;
        messageAr = mapped.messageAr;
        code = exception.code;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      messageAr = 'حدث خطأ غير متوقع';
    }

    logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        messageAr,
        details,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

function mapStatusToCode(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
  };
  return map[status] ?? 'INTERNAL_SERVER_ERROR';
}

function isPrismaError(err: unknown): err is PrismaError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as Record<string, unknown>)['code'] === 'string' &&
    (err as Record<string, unknown>)['code'].toString().startsWith('P')
  );
}
