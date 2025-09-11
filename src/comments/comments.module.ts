import { Module } from '@nestjs/common';

import { CommentsController } from './presentation/comments.controller';

import { CreateCommentUseCase } from './application/use-cases/create-comment.use-case';
import { DeleteCommentUseCase } from './application/use-cases/delete-comment.use-case';
import { ListCommentsByArticleUseCase } from './application/use-cases/list-comments-by-article.use-case';
import { ListRepliesUseCase } from './application/use-cases/list-replies.use-case';

import { CommentRepositoryPort } from './domain/ports/comment.repository.port';

import { PrismaCommentRepository } from './infrastructure/adapters/prisma-comment.repository';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ArticlesModule } from '../articles/articles.module';

@Module({
  imports: [PrismaModule, AuthModule, ArticlesModule],
  controllers: [CommentsController],
  providers: [
    // Application Layer - Use Cases
    CreateCommentUseCase,
    DeleteCommentUseCase,
    ListCommentsByArticleUseCase,
    ListRepliesUseCase,

    // Infrastructure Layer - Adapters
    {
      provide: CommentRepositoryPort,
      useClass: PrismaCommentRepository,
    },
  ],
})
export class CommentsModule {}
