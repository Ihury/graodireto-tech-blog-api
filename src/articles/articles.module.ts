import { Module } from '@nestjs/common';

import { ArticlesController } from './presentation/articles.controller';

import { ListArticlesUseCase } from './application/use-cases/list-articles.use-case';
import { GetArticleByIdUseCase } from './application/use-cases/get-article-by-id.use-case';
import { CreateArticleUseCase } from './application/use-cases/create-article.use-case';
import { UpdateArticleUseCase } from './application/use-cases/update-article.use-case';
import { DeleteArticleUseCase } from './application/use-cases/delete-article.use-case';

import { ArticleRepositoryPort } from './domain/ports/article.repository.port';

import { PrismaArticleRepository } from './infrastructure/adapters/prisma-article.repository';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [ArticlesController],
  providers: [
    // Application Layer - Use Cases
    ListArticlesUseCase,
    GetArticleByIdUseCase,
    CreateArticleUseCase,
    UpdateArticleUseCase,
    DeleteArticleUseCase,

    // Infrastructure Layer - Adapters
    {
      provide: ArticleRepositoryPort,
      useClass: PrismaArticleRepository,
    },
  ],
})
export class ArticlesModule {}
