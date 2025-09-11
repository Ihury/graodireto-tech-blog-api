import { Injectable } from '@nestjs/common';
import {
  ArticleRepositoryPort,
  PaginationOptions,
  ArticleFilters,
} from '../../domain/ports/article.repository.port';
import { Article } from '../../domain/entities/article.entity';
import {
  OffsetPaginatedResult,
  OffsetPaginationUtils,
} from '@/common/pagination';
import { slugify } from '@/common/utils/slug.util';

export interface ListArticlesCommand {
  page?: number;
  size?: number;
  search?: string;
  tags?: string[];
}

export type ListArticlesResult = OffsetPaginatedResult<Article>;

@Injectable()
export class ListArticlesUseCase {
  constructor(private readonly articleRepository: ArticleRepositoryPort) {}

  async execute(command: ListArticlesCommand): Promise<ListArticlesResult> {
    const page = command.page || 1;
    const size = Math.min(command.size || 10, 50); // Máximo 50 itens por página
    const offset = (page - 1) * size;

    const filters: ArticleFilters = {};

    // Se há busca, normaliza o termo para buscar por slug
    if (command.search) {
      const normalizedSearch = slugify(command.search);
      if (normalizedSearch) {
        filters.slugSearch = normalizedSearch;
      }
    }

    // Se há filtro por tags
    if (command.tags && command.tags.length > 0) {
      filters.tagSlugs = command.tags;
    }

    const pagination: PaginationOptions = {
      limit: size,
      offset,
    };

    const result = await this.articleRepository.findMany(filters, pagination);

    return OffsetPaginationUtils.createResult(
      result.articles,
      page,
      size,
      result.total,
    );
  }
}
