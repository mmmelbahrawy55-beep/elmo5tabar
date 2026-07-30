import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '../interfaces/api-response.interface';

interface TransformedResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, TransformedResponse<T>> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<TransformedResponse<T>> {
    return next.handle().pipe(
      map((responseData: ApiResponse<T> | T) => {
        const timestamp = new Date().toISOString();

        if (
          typeof responseData === 'object' &&
          responseData !== null &&
          'success' in responseData &&
          'data' in responseData
        ) {
          const apiResponse = responseData as ApiResponse<T>;
          return {
            success: apiResponse.success,
            data: apiResponse.data,
            message: apiResponse.message,
            pagination: apiResponse.pagination,
            timestamp,
          };
        }

        return {
          success: true,
          data: responseData as T,
          timestamp,
        };
      }),
    );
  }
}
