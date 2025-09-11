import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  CommentResponse,
  CommentWithRepliesResponse,
} from '../../application/mappers/comment.mapper';
import { CursorPaginationMetaDto } from '@/common/pagination';
import { UserResponseDto } from '@/auth/presentation/dto/user-response.dto';

export class CommentResponseDto implements CommentResponse {
  @ApiProperty({
    description: 'ID do comentário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'ID do artigo',
    example: '456e7890-e89b-12d3-a456-426614174001',
  })
  @Expose()
  articleId!: string;

  @ApiProperty({
    description: 'ID do comentário pai (se for uma resposta)',
    example: '789e1234-e89b-12d3-a456-426614174002',
    required: false,
  })
  @Expose()
  parentId?: string;

  @ApiProperty({
    description: 'Informações do autor do comentário',
    type: UserResponseDto,
  })
  @Expose()
  @Type(() => UserResponseDto)
  author!: UserResponseDto;

  @ApiProperty({
    description: 'Conteúdo do comentário',
    example: 'Excelente artigo! Muito esclarecedor.',
  })
  @Expose()
  content!: string;

  @ApiProperty({
    description: 'Data de criação do comentário',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  createdAt!: Date;

  @ApiProperty({
    description: 'Data de última atualização',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  updatedAt!: Date;

  constructor(partial: Partial<CommentResponseDto>) {
    Object.assign(this, partial);
  }
}

export class CommentRepliesDto {
  @ApiProperty({
    description: 'Lista de respostas do comentário',
    type: [CommentResponseDto],
  })
  @Expose()
  @Type(() => CommentResponseDto)
  data!: CommentResponseDto[];

  @ApiProperty({
    description: 'Metadados da paginação das respostas',
    type: CursorPaginationMetaDto,
  })
  @Expose()
  @Type(() => CursorPaginationMetaDto)
  meta!: CursorPaginationMetaDto;

  constructor(partial: Partial<CommentRepliesDto>) {
    Object.assign(this, partial);
  }
}

export class CommentWithRepliesResponseDto
  implements CommentWithRepliesResponse
{
  @ApiProperty({
    description: 'ID do comentário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'ID do artigo',
    example: '456e7890-e89b-12d3-a456-426614174001',
  })
  @Expose()
  articleId!: string;

  @ApiProperty({
    description: 'ID do comentário pai (se for uma resposta)',
    example: '789e1234-e89b-12d3-a456-426614174002',
    required: false,
  })
  @Expose()
  parentId?: string;

  @ApiProperty({
    description: 'Informações do autor do comentário',
    type: UserResponseDto,
  })
  @Expose()
  @Type(() => UserResponseDto)
  author!: UserResponseDto;

  @ApiProperty({
    description: 'Conteúdo do comentário',
    example: 'Excelente artigo! Muito esclarecedor.',
  })
  @Expose()
  content!: string;

  @ApiProperty({
    description: 'Data de criação do comentário',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  createdAt!: Date;

  @ApiProperty({
    description: 'Data de última atualização',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  updatedAt!: Date;

  @ApiProperty({
    description: 'Respostas do comentário com paginação',
    type: CommentRepliesDto,
  })
  @Expose()
  @Type(() => CommentRepliesDto)
  replies!: CommentRepliesDto;

  constructor(partial: Partial<CommentWithRepliesResponseDto>) {
    Object.assign(this, partial);
  }
}
