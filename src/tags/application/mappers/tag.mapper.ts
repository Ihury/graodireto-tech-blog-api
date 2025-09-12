import { Tag } from '../../domain/entities/tag.entity';

export interface TagResponse {
  slug: string;
  name: string;
  createdAt: Date;
}

export class TagMapper {
  static toResponse(tag: Tag): TagResponse {
    return {
      slug: tag.getSlug().getValue(),
      name: tag.getName().getValue(),
      createdAt: tag.getCreatedAt(),
    };
  }

  static toListResponse(tags: Tag[]): TagResponse[] {
    return tags.map((tag) => this.toResponse(tag));
  }
}
