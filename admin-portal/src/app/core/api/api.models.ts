/** Success envelope returned by every API endpoint. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Pagination {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
}

/** Shape of `data` for every paginated list. */
export interface Paginated<T> {
  list: T[];
  pagination: Pagination;
}

/** Error envelope: `errors` holds field messages on 422, `error_code` a machine-readable reason. */
export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  error_code?: string;
  retry_after?: number;
}

/** Standard admin list query: search, allow-listed sort, page size (max 100) and page. */
export interface ListQuery {
  search?: string;
  column?: string;
  dir?: 'asc' | 'desc';
  length?: number;
  page?: number;
  [k: string]: unknown;
}
