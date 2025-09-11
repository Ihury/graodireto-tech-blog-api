import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateArticleDto {
  @ApiProperty({
    description: 'Título do artigo',
    example: 'Como implementar Clean Architecture no NestJS - Atualizado',
    minLength: 5,
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Título deve ser uma string' })
  @MinLength(5, { message: 'Título deve ter pelo menos 5 caracteres' })
  @MaxLength(200, { message: 'Título não pode ter mais de 200 caracteres' })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  title?: string;

  @ApiProperty({
    description: 'Conteúdo completo do artigo',
    example:
      'Clean Architecture é um padrão arquitetural que... [conteúdo atualizado]',
    minLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Conteúdo deve ser uma string' })
  @MinLength(50, { message: 'Conteúdo deve ter pelo menos 50 caracteres' })
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : value,
  )
  content?: string;

  @ApiProperty({
    description: 'URL da imagem de capa do artigo',
    example: 'https://exemplo.com/nova-imagem.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'URL da imagem deve ser uma string' })
  @IsUrl({}, { message: 'URL da imagem deve ter um formato válido' })
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Array de slugs das tags do artigo (opcional)',
    example: ['frontend', 'nestjs', 'clean-architecture', 'typescript'],
    type: [String],
    required: false,
    maxItems: 10,
  })
  @IsOptional()
  @IsArray({ message: 'Tags deve ser um array' })
  @IsString({ each: true, message: 'Cada tag deve ser uma string' })
  @ArrayMaxSize(10, { message: 'Máximo de 10 tags por artigo' })
  @Transform(({ value }): string[] | undefined =>
    Array.isArray(value)
      ? value.map((tag: unknown): string =>
          typeof tag === 'string' ? tag.trim().toLowerCase() : String(tag),
        )
      : value,
  )
  tags?: string[];
}
