import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CommentRepositoryPort,
  CommentListResult,
  CommentWithRepliesPreview,
  CommentsByArticleResult,
} from '../../domain/ports/comment.repository.port';
import { Comment } from '../../domain/entities/comment.entity';
import { Uuid } from '@/common/domain/value-objects';
import { CommentContent } from '../../domain/value-objects';
import {
  CursorPaginationOptions,
  CursorPaginationUtils,
} from '@/common/pagination';

@Injectable()
export class PrismaCommentRepository implements CommentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: Uuid): Promise<Comment | null> {
    const commentData = await this.prisma.comment.findUnique({
      where: { id: id.getValue(), is_deleted: false },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
    });

    return commentData ? this.toDomain(commentData) : null;
  }

  async findByArticleId(
    articleId: Uuid,
    pagination?: CursorPaginationOptions,
  ): Promise<CommentsByArticleResult> {
    const size = pagination?.size || 10;
    const limit = size + 1;

    const where: any = {
      article_id: articleId.getValue(),
      parent_id: null, // Apenas comentários principais
      is_deleted: false,
    };

    if (pagination?.after) {
      const decodedCursor = CursorPaginationUtils.decodeCursor(
        pagination.after,
      );
      if (decodedCursor) {
        where.OR = [
          {
            created_at: { lt: decodedCursor.createdAt },
          },
          {
            created_at: decodedCursor.createdAt,
            id: { lt: decodedCursor.id },
          },
        ];
      }
    }

    const comments = await this.prisma.comment.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            display_name: true,
            avatar_url: true,
          },
        },
        replies: {
          where: {
            is_deleted: false,
          },
          orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
          take: 3, // +1 para verificar se há próxima página
          include: {
            author: {
              select: {
                id: true,
                display_name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: limit,
    });

    const hasNext = comments.length > size;
    const data = hasNext ? comments.slice(0, size) : comments;

    const commentsWithPreview: CommentWithRepliesPreview[] = data.map(
      (comment) => {
        const hasMoreReplies = comment.replies.length > 2;
        const repliesData = hasMoreReplies
          ? comment.replies.slice(0, 2)
          : comment.replies;

        const nextCursor =
          hasMoreReplies && repliesData.length > 0
            ? CursorPaginationUtils.encodeCursor(
                repliesData[repliesData.length - 1].id,
                repliesData[repliesData.length - 1].created_at,
              )
            : undefined;

        return {
          comment: this.toDomain(comment),
          replies: {
            data: repliesData.map((reply) => this.toDomain(reply)),
            meta: {
              size: repliesData.length,
              nextCursor,
            },
          },
        };
      },
    );

    const nextCursor =
      hasNext && data.length > 0
        ? CursorPaginationUtils.encodeCursor(
            data[data.length - 1].id,
            data[data.length - 1].created_at,
          )
        : undefined;

    return {
      data: commentsWithPreview,
      meta: {
        size: data.length,
        nextCursor,
      },
    };
  }

  async findRepliesByParentId(
    parentId: Uuid,
    pagination?: CursorPaginationOptions,
  ): Promise<CommentListResult> {
    const size = pagination?.size || 10;
    const limit = size + 1;

    const where: any = {
      parent_id: parentId.getValue(),
      is_deleted: false,
    };

    if (pagination?.after) {
      const decodedCursor = CursorPaginationUtils.decodeCursor(
        pagination.after,
      );
      if (decodedCursor) {
        where.OR = [
          {
            created_at: { gt: decodedCursor.createdAt },
          },
          {
            created_at: decodedCursor.createdAt,
            id: { gt: decodedCursor.id },
          },
        ];
      }
    }

    const replies = await this.prisma.comment.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
      take: limit,
    });

    const hasNext = replies.length > size;
    const data = hasNext ? replies.slice(0, size) : replies;

    const domainReplies = data.map((reply) => this.toDomain(reply));

    const nextCursor =
      hasNext && data.length > 0
        ? CursorPaginationUtils.encodeCursor(
            data[data.length - 1].id,
            data[data.length - 1].created_at,
          )
        : undefined;

    return {
      data: domainReplies,
      meta: {
        size: data.length,
        nextCursor,
      },
    };
  }

  async save(comment: Comment): Promise<Comment> {
    const plainComment = comment.toPlainObject();

    const commentData = await this.prisma.comment.upsert({
      where: { id: plainComment.id },
      update: {
        content: plainComment.content,
        updated_at: plainComment.updated_at,
      },
      create: plainComment,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            display_name: true,
            avatar_url: true,
          },
        },
      },
    });

    return this.toDomain(commentData);
  }

  async delete(id: Uuid): Promise<void> {
    await this.prisma.comment.update({
      where: { id: id.getValue() },
      data: { is_deleted: true, updated_at: new Date() },
    });
  }

  private toDomain(commentData: {
    id: string;
    article_id: string;
    parent_id: string | null;
    author_id: string;
    content: string;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
    author?: {
      id: string;
      email: string;
      display_name: string;
      avatar_url?: string | null;
    };
  }): Comment {
    return Comment.reconstitute({
      id: Uuid.create(commentData.id),
      articleId: Uuid.create(commentData.article_id),
      parentId: commentData.parent_id
        ? Uuid.create(commentData.parent_id)
        : undefined,
      authorId: Uuid.create(commentData.author_id),
      author: commentData.author
        ? {
            id: commentData.author.id,
            email: commentData.author.email,
            displayName: commentData.author.display_name,
            avatarUrl: commentData.author.avatar_url || undefined,
          }
        : undefined,
      content: CommentContent.create(commentData.content),
      isDeleted: commentData.is_deleted,
      createdAt: commentData.created_at,
      updatedAt: commentData.updated_at,
    });
  }
}
