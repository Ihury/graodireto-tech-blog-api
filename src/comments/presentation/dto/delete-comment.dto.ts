import { ApiProperty } from '@nestjs/swagger';

export class DeleteCommentResponseDto {
  @ApiProperty({
    description: 'Indica se a operação foi bem-sucedida',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Mensagem de confirmação',
    example: 'Comentário deletado com sucesso',
  })
  message!: string;

  constructor(partial: Partial<DeleteCommentResponseDto>) {
    Object.assign(this, partial);
  }
}
