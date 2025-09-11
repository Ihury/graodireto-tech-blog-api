import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleRepositoryPort } from '../../domain/ports/article.repository.port';
import { Article } from '../../domain/entities/article.entity';
import { Uuid } from '@/common/domain/value-objects';

export interface GetArticleByIdCommand {
  id: string;
}

export interface GetArticleByIdResult {
  article: Article;
}

@Injectable()
export class GetArticleByIdUseCase {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(command: GetArticleByIdCommand): Promise<GetArticleByIdResult> {
    try {
      const articleId = Uuid.create(command.id);
      const article = await this.articleRepository.findById(articleId);

      if (!article) {
        throw new NotFoundException('Artigo não encontrado');
      }

      if (article.isArticleDeleted()) {
        throw new NotFoundException('Artigo não encontrado');
      }

      return {
        article,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Artigo não encontrado');
    }
  }
}
