import { Article } from '../entities/article.entity';
import { Uuid } from '@/common/domain/value-objects';
import { ArticleSlug } from '../value-objects';

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface ArticleListResult {
  articles: Article[];
  total: number;
}

export interface ArticleFilters {
  slugSearch?: string;
  tagSlugs?: string[];
}

export abstract class ArticleRepositoryPort {
  abstract findById(id: Uuid): Promise<Article | null>;
  abstract findBySlug(slug: ArticleSlug): Promise<Article | null>;
  abstract findMany(
    filters?: ArticleFilters,
    pagination?: PaginationOptions,
  ): Promise<ArticleListResult>;
  abstract save(article: Article): Promise<Article>;
  abstract delete(id: Uuid): Promise<void>;
}
