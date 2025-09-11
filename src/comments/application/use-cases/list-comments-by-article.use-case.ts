import { Injectable } from '@nestjs/common';
import {
  CommentRepositoryPort,
  CommentsByArticleResult,
} from '../../domain/ports/comment.repository.port';
import { Uuid } from '@/common/domain/value-objects';
import { CursorPaginationOptions } from '@/common/pagination';

export interface ListCommentsByArticleCommand {
  articleId: string;
  size?: number;
  after?: string;
}

export type ListCommentsByArticleResult = CommentsByArticleResult;

@Injectable()
export class ListCommentsByArticleUseCase {
  constructor(private readonly commentRepository: CommentRepositoryPort) {}

  async execute(
    command: ListCommentsByArticleCommand,
  ): Promise<ListCommentsByArticleResult> {
    const articleId = Uuid.create(command.articleId);

    const pagination: CursorPaginationOptions = {
      size: Math.min(command.size || 10, 50), // Máximo 50 itens por página
      after: command.after,
    };

    return await this.commentRepository.findByArticleId(articleId, pagination);
  }
}
