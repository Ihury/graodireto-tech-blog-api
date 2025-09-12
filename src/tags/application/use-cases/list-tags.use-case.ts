import { Injectable } from '@nestjs/common';
import { TagRepositoryPort } from '../../domain/ports/tag.repository.port';
import { Tag } from '../../domain/entities/tag.entity';

export interface ListTagsResult {
  tags: Tag[];
  total: number;
}

@Injectable()
export class ListTagsUseCase {
  constructor(private readonly tagRepository: TagRepositoryPort) {}

  async execute(): Promise<ListTagsResult> {
    const result = await this.tagRepository.findMany();

    return {
      tags: result.tags,
      total: result.total,
    };
  }
}
