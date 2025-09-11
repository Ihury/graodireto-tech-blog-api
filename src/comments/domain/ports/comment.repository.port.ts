import { Comment } from '../entities/comment.entity';
import { Uuid } from '@/common/domain/value-objects';
import {
  CursorPaginationOptions,
  CursorPaginatedResult,
} from '@/common/pagination';

export type CommentListResult = CursorPaginatedResult<Comment>;

export interface CommentWithRepliesPreview {
  comment: Comment;
  replies: CommentListResult;
}

export type CommentsByArticleResult =
  CursorPaginatedResult<CommentWithRepliesPreview>;

export abstract class CommentRepositoryPort {
  abstract findById(id: Uuid): Promise<Comment | null>;

  abstract findByArticleId(
    articleId: Uuid,
    pagination?: CursorPaginationOptions,
  ): Promise<CommentsByArticleResult>;

  abstract findRepliesByParentId(
    parentId: Uuid,
    pagination?: CursorPaginationOptions,
  ): Promise<CommentListResult>;

  abstract save(comment: Comment): Promise<Comment>;

  abstract delete(id: Uuid): Promise<void>;
}
