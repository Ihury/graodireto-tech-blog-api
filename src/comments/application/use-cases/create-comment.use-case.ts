import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CommentRepositoryPort } from '../../domain/ports/comment.repository.port';
import { Comment } from '../../domain/entities/comment.entity';
import { Uuid } from '@/common/domain/value-objects';
import { CommentContent } from '../../domain/value-objects';
import { InvalidValueObjectError } from '@/common';
import { ArticleRepositoryPort } from '@/articles/domain/ports/article.repository.port';

export interface CreateCommentCommand {
  articleId: string;
  authorId: string;
  content: string;
  parentId?: string;
}

export interface CreateCommentResult {
  comment: Comment;
}

@Injectable()
export class CreateCommentUseCase {
  constructor(
    private readonly commentRepository: CommentRepositoryPort,
    private readonly articleRepository: ArticleRepositoryPort,
  ) {}

  async execute(command: CreateCommentCommand): Promise<CreateCommentResult> {
    try {
      const articleId = Uuid.create(command.articleId);
      const authorId = Uuid.create(command.authorId);
      const content = CommentContent.create(command.content);

      const article = await this.articleRepository.findById(articleId);
      if (!article) {
        throw new NotFoundException('Artigo não encontrado');
      }

      let parentId: Uuid | undefined;

      if (command.parentId) {
        parentId = Uuid.create(command.parentId);

        const parentComment = await this.commentRepository.findById(parentId);
        if (!parentComment) {
          throw new NotFoundException('Comentário pai não encontrado');
        }

        if (parentComment.isReply()) {
          throw new BadRequestException(
            'Não é possível responder a uma resposta. Apenas comentários principais podem ter respostas.',
          );
        }

        if (!parentComment.getArticleId().equals(articleId)) {
          throw new BadRequestException(
            'O comentário pai deve pertencer ao mesmo artigo',
          );
        }
      }

      const comment = Comment.create({
        articleId,
        authorId,
        content,
        parentId,
      });

      const savedComment = await this.commentRepository.save(comment);

      return {
        comment: savedComment,
      };
    } catch (error) {
      if (error instanceof InvalidValueObjectError) {
        throw new BadRequestException(error.message);
      }
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw error;
    }
  }
}
