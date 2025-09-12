import { Tag } from '../entities/tag.entity';

export interface TagListResult {
  tags: Tag[];
  total: number;
}

export abstract class TagRepositoryPort {
  abstract findMany(): Promise<TagListResult>;
}
