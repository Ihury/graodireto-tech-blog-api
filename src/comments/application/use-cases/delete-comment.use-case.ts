import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CommentRepositoryPort } from '../../domain/ports/comment.repository.port';
import { Uuid } from '@/common/domain/value-objects';

export interface DeleteCommentCommand {
  id: string;
  authorId: string;
}

export interface DeleteCommentResult {
  success: boolean;
}

@Injectable()
export class DeleteCommentUseCase {
  constructor(private readonly commentRepository: CommentRepositoryPort) {}

  async execute(command: DeleteCommentCommand): Promise<DeleteCommentResult> {
    try {
      const commentId = Uuid.create(command.id);
      const authorId = Uuid.create(command.authorId);

      const comment = await this.commentRepository.findById(commentId);

      if (!comment) {
        throw new NotFoundException('Comentário não encontrado');
      }

      if (comment.isCommentDeleted()) {
        throw new NotFoundException('Comentário não encontrado');
      }

      if (!comment.getAuthorId().equals(authorId)) {
        throw new ForbiddenException(
          'Você não tem permissão para deletar este comentário',
        );
      }

      await this.commentRepository.delete(commentId);

      return {
        success: true,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new NotFoundException('Comentário não encontrado');
    }
  }
}
