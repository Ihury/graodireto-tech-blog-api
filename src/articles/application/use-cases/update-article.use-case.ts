import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ArticleRepositoryPort } from '../../domain/ports/article.repository.port';
import { Article } from '../../domain/entities/article.entity';
import { Uuid } from '@/common/domain/value-objects';
import {
  ArticleTitle,
  ArticleContent,
  ArticleSummary,
} from '../../domain/value-objects';
import { InvalidValueObjectError } from '@/common';

export interface UpdateArticleCommand {
  id: string;
  authorId: string; // Para verificar se o usuário pode editar o artigo
  title?: string;
  content?: string;
  coverImageUrl?: string;
  tags?: string[];
}

export interface UpdateArticleResult {
  article: Article;
}

@Injectable()
export class UpdateArticleUseCase {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(command: UpdateArticleCommand): Promise<UpdateArticleResult> {
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
          'Você não tem permissão para editar este artigo',
        );
      }

      // Atualizar campos se fornecidos
      if (command.title !== undefined) {
        const newTitle = ArticleTitle.create(command.title);
        article.updateTitle(newTitle);
      }

      if (command.content !== undefined) {
        const newContent = ArticleContent.create(command.content);
        article.updateContent(newContent);

        // Gerar summary automaticamente baseado no novo content
        const newSummary = ArticleSummary.createFromContent(newContent);
        article.updateSummary(newSummary);
      }

      if (command.coverImageUrl !== undefined) {
        article.updateCoverImage(command.coverImageUrl || undefined);
      }

      if (command.tags !== undefined) {
        const tags = command.tags.map((tagSlug) => ({
          slug: tagSlug,
          name: tagSlug,
        }));
        article.updateTags(tags);
      }

      const updatedArticle = await this.articleRepository.save(article);

      return {
        article: updatedArticle,
      };
    } catch (error) {
      if (error instanceof InvalidValueObjectError) {
        throw new BadRequestException(error.message);
      }
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
