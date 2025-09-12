// Module
export { TagsModule } from './tags.module';

// Presentation Layer
export { TagsController } from './presentation/tags.controller';

// Application Layer - Use Cases
export { ListTagsUseCase } from './application/use-cases/list-tags.use-case';

// Application Layer - Mappers
export { TagMapper } from './application/mappers/tag.mapper';
export type { TagResponse } from './application/mappers/tag.mapper';

// Domain Layer - Entities
export { Tag } from './domain/entities/tag.entity';

// Domain Layer - Value Objects
export { TagName, TagSlug } from './domain/value-objects';

// Domain Layer - Ports
export { TagRepositoryPort } from './domain/ports/tag.repository.port';
export type { TagListResult } from './domain/ports/tag.repository.port';

// Presentation Layer - DTOs
export {
  TagResponseDto,
  ListTagsResponseDto,
} from './presentation/dto/tag-response.dto';
