import { Module } from '@nestjs/common';

import { TagsController } from './presentation/tags.controller';

import { ListTagsUseCase } from './application/use-cases/list-tags.use-case';

import { TagRepositoryPort } from './domain/ports/tag.repository.port';

import { PrismaTagRepository } from './infrastructure/adapters/prisma-tag.repository';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '@/auth';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TagsController],
  providers: [
    // Application Layer - Use Cases
    ListTagsUseCase,

    // Infrastructure Layer - Adapters
    {
      provide: TagRepositoryPort,
      useClass: PrismaTagRepository,
    },
  ],
  exports: [TagRepositoryPort],
})
export class TagsModule {}
