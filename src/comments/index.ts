// Module
export { CommentsModule } from './comments.module';

// Presentation Layer
export { CommentsController } from './presentation/comments.controller';

// Application Layer - Use Cases
export { CreateCommentUseCase } from './application/use-cases/create-comment.use-case';
export { DeleteCommentUseCase } from './application/use-cases/delete-comment.use-case';
export { ListCommentsByArticleUseCase } from './application/use-cases/list-comments-by-article.use-case';
export { ListRepliesUseCase } from './application/use-cases/list-replies.use-case';

// Application Layer - Mappers
export { CommentMapper } from './application/mappers/comment.mapper';
export type {
  CommentResponse,
  CommentWithRepliesResponse,
} from './application/mappers/comment.mapper';

// Domain Layer - Entities
export { Comment } from './domain/entities/comment.entity';

// Domain Layer - Value Objects
export { CommentContent } from './domain/value-objects';

// Domain Layer - Ports
export { CommentRepositoryPort } from './domain/ports/comment.repository.port';
export type {
  CommentListResult,
  CommentWithRepliesPreview,
  CommentsByArticleResult,
} from './domain/ports/comment.repository.port';

// Presentation Layer - DTOs
export { CreateCommentDto } from './presentation/dto/create-comment.dto';
export {
  CommentResponseDto,
  CommentWithRepliesResponseDto,
  CommentRepliesDto,
} from './presentation/dto/comment-response.dto';
export {
  ListCommentsDto,
  ListCommentsResponseDto,
} from './presentation/dto/list-comments.dto';
export {
  ListRepliesDto,
  ListRepliesResponseDto,
} from './presentation/dto/list-replies.dto';
export { DeleteCommentResponseDto } from './presentation/dto/delete-comment.dto';
