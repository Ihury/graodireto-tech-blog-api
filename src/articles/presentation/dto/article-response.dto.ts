import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ArticleResponse,
  ArticleListItemResponse,
} from '../../application/mappers/article.mapper';
import { ArticleTag } from '../../domain/entities/article.entity';
import { UserResponseDto } from '@/auth/presentation/dto/user-response.dto';

export class ArticleTagDto implements ArticleTag {
  @ApiProperty({
    description: 'Slug da tag',
    example: 'frontend',
  })
  @Expose()
  slug!: string;

  @ApiProperty({
    description: 'Nome da tag',
    example: 'Frontend',
  })
  @Expose()
  name!: string;
}

export class ArticleResponseDto implements ArticleResponse {
  @ApiProperty({
    description: 'ID do artigo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Informações do autor do artigo',
    type: UserResponseDto,
  })
  @Expose()
  @Type(() => UserResponseDto)
  author!: UserResponseDto;

  @ApiProperty({
    description: 'Título do artigo',
    example: 'Como implementar Clean Architecture no NestJS',
  })
  @Expose()
  title!: string;

  @ApiProperty({
    description: 'Slug do artigo',
    example: 'como-implementar-clean-architecture-no-nestjs',
  })
  @Expose()
  slug!: string;

  @ApiProperty({
    description: 'Resumo do artigo',
    example:
      'Um guia completo sobre como aplicar os princípios da Clean Architecture.',
    required: false,
  })
  @Expose()
  summary?: string;

  @ApiProperty({
    description: 'Conteúdo completo do artigo',
    example: 'Clean Architecture é um padrão arquitetural que...',
  })
  @Expose()
  content!: string;

  @ApiProperty({
    description: 'URL da imagem de capa',
    example: 'https://exemplo.com/imagem.jpg',
    required: false,
  })
  @Expose()
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Tags do artigo',
    type: [ArticleTagDto],
  })
  @Expose()
  @Type(() => ArticleTagDto)
  tags!: ArticleTagDto[];

  @ApiProperty({
    description: 'Data de criação do artigo',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  createdAt!: Date;

  @ApiProperty({
    description: 'Data de última atualização',
    example: '2023-01-02T12:30:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  updatedAt!: Date;

  constructor(partial: Partial<ArticleResponseDto>) {
    Object.assign(this, partial);
  }
}

export class ArticleListItemResponseDto implements ArticleListItemResponse {
  @ApiProperty({
    description: 'ID do artigo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'ID do autor do artigo',
    example: '456e7890-e89b-12d3-a456-426614174001',
  })
  @Expose()
  authorId!: string;

  @ApiProperty({
    description: 'Título do artigo',
    example: 'Como implementar Clean Architecture no NestJS',
  })
  @Expose()
  title!: string;

  @ApiProperty({
    description: 'Slug do artigo',
    example: 'como-implementar-clean-architecture-no-nestjs',
  })
  @Expose()
  slug!: string;

  @ApiProperty({
    description: 'Resumo do artigo',
    example:
      'Um guia completo sobre como aplicar os princípios da Clean Architecture.',
    required: false,
  })
  @Expose()
  summary?: string;

  @ApiProperty({
    description: 'URL da imagem de capa',
    example: 'https://exemplo.com/imagem.jpg',
    required: false,
  })
  @Expose()
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Tags do artigo',
    type: [ArticleTagDto],
  })
  @Expose()
  @Type(() => ArticleTagDto)
  tags!: ArticleTagDto[];

  @ApiProperty({
    description: 'Data de criação do artigo',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  createdAt!: Date;

  @ApiProperty({
    description: 'Data de última atualização',
    example: '2023-01-02T12:30:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  updatedAt!: Date;

  constructor(partial: Partial<ArticleListItemResponseDto>) {
    Object.assign(this, partial);
  }
}
