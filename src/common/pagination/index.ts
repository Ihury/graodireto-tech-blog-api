// ===== BASE PAGINATION =====
export type { BasePaginatedResult } from './pagination';

// ===== OFFSET PAGINATION =====
export type {
  OffsetPaginationMeta,
  OffsetPaginatedResult,
  OffsetPaginationOptions,
} from './offset.pagination';

export {
  OffsetPaginationRequestDto,
  OffsetPaginationMetaDto,
  OffsetPaginatedResponseDto,
  OffsetPaginationUtils,
} from './offset.pagination';

// ===== CURSOR PAGINATION =====
export type {
  CursorPaginationMeta,
  CursorPaginatedResult,
  CursorPaginationOptions,
} from './cursor.pagination';

export {
  CursorPaginationRequestDto,
  CursorPaginationMetaDto,
  CursorPaginatedResponseDto,
  CursorPaginationUtils,
} from './cursor.pagination';
