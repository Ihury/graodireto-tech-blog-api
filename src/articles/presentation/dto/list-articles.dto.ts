import { IsOptional, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ArticleListItemResponseDto } from './article-response.dto';
import {
  OffsetPaginatedResponseDto,
  OffsetPaginationRequestDto,
} from '@/common/pagination';

export class ListArticlesDto extends OffsetPaginationRequestDto {
  @ApiProperty({
    description: 'Termo de busca para filtrar artigos com base no título',
    example: 'Como criar uma API REST',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Busca deve ser uma string' })
  search?: string;

  @ApiProperty({
    description: 'Array de slugs de tags para filtrar artigos',
    example: ['javascript', 'nodejs', 'api-rest'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((tag) => tag.trim());
    }
    return value;
  })
  @IsArray({ message: 'Tags deve ser um array' })
  @IsString({ each: true, message: 'Cada tag deve ser uma string' })
  tags?: string[];
}

export class ListArticlesResponseDto extends OffsetPaginatedResponseDto<ArticleListItemResponseDto> {
  @ApiProperty({
    description: 'Lista de artigos',
    type: [ArticleListItemResponseDto],
  })
  declare data: ArticleListItemResponseDto[];
}
