export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  pagination: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  messageAr: string;
  details?: Record<string, unknown> | string;
}
