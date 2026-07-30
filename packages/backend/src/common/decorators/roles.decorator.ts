import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
  applyDecorators,
  Type,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { ApiResponse } from '../interfaces/api-response.interface';

export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: Record<string, unknown> }>();
    return data ? request.user?.[data] : request.user;
  },
);

export function ApiPaginatedResponse<T extends Type<unknown>>(
  model: T,
  description?: string,
) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: description ?? 'Get paginated results' }),
    ApiOkResponse({
      description: description ?? 'Paginated response',
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'array',
                items: { type: 'object' },
              },
              message: { type: 'string' },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'number', example: 1 },
                  limit: { type: 'number', example: 20 },
                  total: { type: 'number', example: 100 },
                  totalPages: { type: 'number', example: 5 },
                },
              },
            },
          },
        ],
      },
    }),
  );
}
