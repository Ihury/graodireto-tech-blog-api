import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { BasePaginatedResult } from './pagination';

// ===== CURSOR PAGINATION =====

export interface CursorPaginationMeta {
  size: number;
  nextCursor?: string;
}

export interface CursorPaginatedResult<T> extends BasePaginatedResult<T> {
  meta: CursorPaginationMeta;
}

export interface CursorPaginationOptions {
  size: number;
  after?: string;
}

// ===== REQUEST DTO =====

export class CursorPaginationRequestDto implements CursorPaginationOptions {
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

  @ApiProperty({
    description: 'Cursor para buscar itens após este ponto',
    example: 'eyJpZCI6IjQ1NiIsImNyZWF0ZWRfYXQiOiIyMDIzLTEwLTE1VDA5OjAwOjAwWiJ9',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Cursor deve ser uma string' })
  after?: string;
}

// ===== RESPONSE DTO =====

export class CursorPaginationMetaDto implements CursorPaginationMeta {
  @ApiProperty({
    description: 'Número de itens retornados',
    example: 10,
    minimum: 1,
    maximum: 50,
  })
  @Expose()
  size!: number;

  @ApiProperty({
    description: 'Cursor para próxima página (se existir, há mais páginas)',
    example: 'eyJpZCI6IjQ1NiIsImNyZWF0ZWRfYXQiOiIyMDIzLTEwLTE1VDA5OjAwOjAwWiJ9',
    required: false,
  })
  @Expose()
  nextCursor?: string;

  constructor(partial: Partial<CursorPaginationMetaDto>) {
    Object.assign(this, partial);
  }
}

export class CursorPaginatedResponseDto<T> implements CursorPaginatedResult<T> {
  @ApiProperty({
    description: 'Dados paginados',
    isArray: true,
  })
  @Expose()
  data!: T[];

  @ApiProperty({
    description: 'Metadados da paginação por cursor',
    type: CursorPaginationMetaDto,
  })
  @Expose()
  @Type(() => CursorPaginationMetaDto)
  meta!: CursorPaginationMetaDto;

  constructor(data: T[], meta: CursorPaginationMeta) {
    this.data = data;
    this.meta = new CursorPaginationMetaDto(meta);
  }
}

// ===== UTILITIES =====

export class CursorPaginationUtils {
  /**
   * Codifica um cursor baseado em ID e timestamp
   */
  static encodeCursor(id: string, timestamp: Date): string {
    const payload = { id, createdAt: timestamp.toISOString() };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Decodifica um cursor para obter ID e timestamp
   */
  static decodeCursor(cursor: string): { id: string; createdAt: Date } | null {
    try {
      const payload = JSON.parse(Buffer.from(cursor, 'base64').toString());
      return {
        id: payload.id,
        createdAt: new Date(payload.createdAt),
      };
    } catch {
      return null;
    }
  }

  /**
   * Processa resultado do banco (size + 1) e cria paginação otimizada
   */
  static createFromRawData<T extends { id: string; createdAt: Date }>(
    rawData: T[],
    requestedSize: number,
  ): CursorPaginatedResult<T> {
    const hasNext = rawData.length > requestedSize;

    // Retornar apenas os itens solicitados (sem o +1)
    const data = hasNext ? rawData.slice(0, requestedSize) : rawData;

    // nextCursor só existe se há próxima página
    const nextCursor =
      hasNext && data.length > 0
        ? this.encodeCursor(
            data[data.length - 1].id,
            data[data.length - 1].createdAt,
          )
        : undefined;

    return {
      data,
      meta: {
        size: data.length,
        nextCursor,
      },
    };
  }
}
