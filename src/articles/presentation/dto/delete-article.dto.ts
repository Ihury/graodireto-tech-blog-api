import { ApiProperty } from '@nestjs/swagger';

export class DeleteArticleResponseDto {
  @ApiProperty({
    description: 'Indica se a operação foi bem-sucedida',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Mensagem de confirmação',
    example: 'Artigo deletado com sucesso',
  })
  message!: string;

  constructor(partial: Partial<DeleteArticleResponseDto>) {
    Object.assign(this, partial);
  }
}
