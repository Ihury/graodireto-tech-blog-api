import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ArticleRepositoryPort } from '../../domain/ports/article.repository.port';
import { Uuid } from '@/common/domain/value-objects';

export interface DeleteArticleCommand {
  id: string;
  authorId: string; // Para verificar se o usuário pode deletar o artigo
}

export interface DeleteArticleResult {
  success: boolean;
}

@Injectable()
export class DeleteArticleUseCase {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(command: DeleteArticleCommand): Promise<DeleteArticleResult> {
    try {
      const articleId = Uuid.create(command.id);
      const authorId = Uuid.create(command.authorId);

      const article = await this.articleRepository.findById(articleId);

      if (!article) {
        throw new NotFoundException('Artigo não encontrado');
      }

      if (article.isArticleDeleted()) {
        throw new NotFoundException('Artigo não encontrado');
      }

      // Verificar se o usuário é o autor do artigo
      if (!article.getAuthorId().equals(authorId)) {
        throw new ForbiddenException(
          'Você não tem permissão para deletar este artigo',
        );
      }

      // Soft delete - marca como deletado mas não remove do banco
      article.softDelete();
      await this.articleRepository.save(article);

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
      throw new NotFoundException('Artigo não encontrado');
    }
  }
}
