// Module
export { ArticlesModule } from './articles.module';

// Presentation Layer
export { ArticlesController } from './presentation/articles.controller';

// Application Layer - Use Cases
export { ListArticlesUseCase } from './application/use-cases/list-articles.use-case';
export { GetArticleByIdUseCase } from './application/use-cases/get-article-by-id.use-case';
export { CreateArticleUseCase } from './application/use-cases/create-article.use-case';
export { UpdateArticleUseCase } from './application/use-cases/update-article.use-case';
export { DeleteArticleUseCase } from './application/use-cases/delete-article.use-case';

// Application Layer - Mappers
export { ArticleMapper } from './application/mappers/article.mapper';
export type {
  ArticleResponse,
  ArticleListItemResponse,
} from './application/mappers/article.mapper';

// Domain Layer - Entities
export { Article } from './domain/entities/article.entity';

// Domain Layer - Value Objects
export {
  ArticleTitle,
  ArticleContent,
  ArticleSummary,
  ArticleSlug,
} from './domain/value-objects';

// Domain Layer - Ports
export { ArticleRepositoryPort } from './domain/ports/article.repository.port';
export type {
  PaginationOptions,
  ArticleListResult,
  ArticleFilters,
} from './domain/ports/article.repository.port';

// Presentation Layer - DTOs
export { CreateArticleDto } from './presentation/dto/create-article.dto';
export { UpdateArticleDto } from './presentation/dto/update-article.dto';
export {
  ListArticlesDto,
  ListArticlesResponseDto,
} from './presentation/dto/list-articles.dto';
export {
  ArticleResponseDto,
  ArticleListItemResponseDto,
} from './presentation/dto/article-response.dto';
export { DeleteArticleResponseDto } from './presentation/dto/delete-article.dto';
