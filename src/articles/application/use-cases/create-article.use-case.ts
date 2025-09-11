import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ArticleRepositoryPort } from '../../domain/ports/article.repository.port';
import { Article } from '../../domain/entities/article.entity';
import { Uuid } from '@/common/domain/value-objects';
import {
  ArticleTitle,
  ArticleContent,
  ArticleSummary,
  ArticleSlug,
} from '../../domain/value-objects';
import { InvalidValueObjectError } from '@/common';

export interface CreateArticleCommand {
  authorId: string;
  title: string;
  content: string;
  coverImageUrl?: string;
  tags?: string[];
}

export interface CreateArticleResult {
  article: Article;
}

@Injectable()
export class CreateArticleUseCase {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(command: CreateArticleCommand): Promise<CreateArticleResult> {
    try {
      const authorId = Uuid.create(command.authorId);
      const title = ArticleTitle.create(command.title);
      const content = ArticleContent.create(command.content);

      // Converter tags de string para ArticleTag
      const tags =
        command.tags?.map((tagSlug) => ({
          slug: tagSlug,
          name: tagSlug, // Por enquanto, usar o slug como name temporariamente
        })) || [];

      const article = Article.create({
        authorId,
        title,
        content,
        coverImageUrl: command.coverImageUrl,
        tags,
      });

      const savedArticle = await this.articleRepository.save(article);

      return {
        article: savedArticle,
      };
    } catch (error) {
      if (error instanceof InvalidValueObjectError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
