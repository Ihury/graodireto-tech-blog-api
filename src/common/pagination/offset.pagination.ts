import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { BasePaginatedResult } from './pagination';

// ===== OFFSET PAGINATION =====

export interface OffsetPaginationMeta {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface OffsetPaginatedResult<T> extends BasePaginatedResult<T> {
  meta: OffsetPaginationMeta;
}

export interface OffsetPaginationOptions {
  page: number;
  size: number;
}

// ===== REQUEST DTO =====

export class OffsetPaginationRequestDto implements OffsetPaginationOptions {
  @ApiProperty({
    description: 'Número da página',
    example: 1,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser maior que 0' })
  page: number = 1;

  @ApiProperty({
    description: 'Número de itens por página',
    example: 10,
    minimum: 1,
    maximum: 50,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser maior que 0' })
  @Max(50, { message: 'Limite não pode ser maior que 50' })
  size: number = 10;
}

// ===== RESPONSE DTO =====

export class OffsetPaginationMetaDto implements OffsetPaginationMeta {
  @ApiProperty({
    description: 'Página atual',
    example: 1,
    minimum: 1,
  })
  @Expose()
  page!: number;

  @ApiProperty({
    description: 'Número de itens por página',
    example: 10,
    minimum: 1,
    maximum: 50,
  })
  @Expose()
  size!: number;

  @ApiProperty({
    description: 'Total de itens encontrados',
    example: 25,
    minimum: 0,
  })
  @Expose()
  total!: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 3,
    minimum: 0,
  })
  @Expose()
  totalPages!: number;

  @ApiProperty({
    description: 'Indica se há próxima página',
    example: true,
  })
  @Expose()
  hasNext!: boolean;

  @ApiProperty({
    description: 'Indica se há página anterior',
    example: false,
  })
  @Expose()
  hasPrevious!: boolean;

  constructor(partial: Partial<OffsetPaginationMetaDto>) {
    Object.assign(this, partial);
  }
}

export class OffsetPaginatedResponseDto<T> implements OffsetPaginatedResult<T> {
  @ApiProperty({
    description: 'Dados paginados',
    isArray: true,
  })
  @Expose()
  data!: T[];

  @ApiProperty({
    description: 'Metadados da paginação por offset',
    type: OffsetPaginationMetaDto,
  })
  @Expose()
  @Type(() => OffsetPaginationMetaDto)
  meta!: OffsetPaginationMetaDto;

  constructor(data: T[], meta: OffsetPaginationMeta) {
    this.data = data;
    this.meta = new OffsetPaginationMetaDto(meta);
  }
}

// ===== UTILITIES =====

export class OffsetPaginationUtils {
  static createMeta(
    page: number,
    size: number,
    total: number,
  ): OffsetPaginationMeta {
    const totalPages = Math.ceil(total / size);

    return {
      page,
      size,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  static createResult<T>(
    data: T[],
    page: number,
    size: number,
    total: number,
  ): OffsetPaginatedResult<T> {
    return {
      data,
      meta: this.createMeta(page, size, total),
    };
  }
}
