import { Injectable } from '@nestjs/common';
import {
  CommentRepositoryPort,
  CommentListResult,
} from '../../domain/ports/comment.repository.port';
import { Uuid } from '@/common/domain/value-objects';
import { CursorPaginationOptions } from '@/common/pagination';

export interface ListRepliesCommand {
  parentId: string;
  size?: number;
  after?: string;
}

export type ListRepliesResult = CommentListResult;

@Injectable()
export class ListRepliesUseCase {
  constructor(private readonly commentRepository: CommentRepositoryPort) {}

  async execute(command: ListRepliesCommand): Promise<ListRepliesResult> {
    const parentId = Uuid.create(command.parentId);

    const pagination: CursorPaginationOptions = {
      size: Math.min(command.size || 10, 50), // Máximo 50 itens por página
      after: command.after,
    };

    return await this.commentRepository.findRepliesByParentId(
      parentId,
      pagination,
    );
  }
}
