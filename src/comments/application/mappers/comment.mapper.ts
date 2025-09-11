import { Comment } from '../../domain/entities/comment.entity';
import { CommentWithRepliesPreview } from '../../domain/ports/comment.repository.port';
import { UserResponse } from '@/auth';

export interface CommentResponse {
  id: string;
  articleId: string;
  parentId?: string;
  author: UserResponse;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentWithRepliesResponse extends CommentResponse {
  replies: {
    data: CommentResponse[];
    meta: {
      size: number;
      nextCursor?: string;
    };
  };
}

export class CommentMapper {
  static toResponse(comment: Comment): CommentResponse {
    const author = comment.getAuthor();
    if (!author) {
      throw new Error('Author information is required for comment response');
    }

    return {
      id: comment.getId().getValue(),
      articleId: comment.getArticleId().getValue(),
      parentId: comment.getParentId()?.getValue(),
      author: {
        id: author.id,
        email: author.email,
        displayName: author.displayName,
        avatarUrl: author.avatarUrl,
      },
      content: comment.getContent().getValue(),
      createdAt: comment.getCreatedAt(),
      updatedAt: comment.getUpdatedAt(),
    };
  }

  static toWithRepliesResponse(
    commentWithReplies: CommentWithRepliesPreview,
  ): CommentWithRepliesResponse {
    return {
      ...this.toResponse(commentWithReplies.comment),
      replies: {
        data: commentWithReplies.replies.data.map((reply) =>
          this.toResponse(reply),
        ),
        meta: commentWithReplies.replies.meta,
      },
    };
  }

  static toListResponse(comments: Comment[]): CommentResponse[] {
    return comments.map((comment) => this.toResponse(comment));
  }

  static toListWithRepliesResponse(
    commentsWithReplies: CommentWithRepliesPreview[],
  ): CommentWithRepliesResponse[] {
    return commentsWithReplies.map((commentWithReplies) =>
      this.toWithRepliesResponse(commentWithReplies),
    );
  }
}
