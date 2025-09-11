import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Conteúdo do comentário',
    example: 'Excelente artigo! Muito esclarecedor.',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString({ message: 'Conteúdo deve ser uma string' })
  @MinLength(1, { message: 'Conteúdo deve ter pelo menos 1 caractere' })
  @MaxLength(1000, { message: 'Conteúdo não pode ter mais de 1000 caracteres' })
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.trim() : value,
  )
  content!: string;

  @ApiProperty({
    description: 'ID do comentário pai (opcional, para respostas)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'ID do comentário pai deve ser uma string' })
  @IsUUID(4, { message: 'ID do comentário pai deve ser um UUID válido' })
  parentId?: string;
}
