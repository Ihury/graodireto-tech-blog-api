import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { TagResponse } from '../../application/mappers/tag.mapper';

export class TagResponseDto implements TagResponse {
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

  @ApiProperty({
    description: 'Data de criação da tag',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  createdAt!: Date;

  constructor(partial: Partial<TagResponseDto>) {
    Object.assign(this, partial);
  }
}

export class ListTagsResponseDto {
  @ApiProperty({
    description: 'Lista de tags disponíveis',
    type: [TagResponseDto],
  })
  @Expose()
  @Type(() => TagResponseDto)
  tags!: TagResponseDto[];

  @ApiProperty({
    description: 'Total de tags disponíveis',
    example: 15,
  })
  @Expose()
  total!: number;

  constructor(partial: Partial<ListTagsResponseDto>) {
    Object.assign(this, partial);
  }
}
