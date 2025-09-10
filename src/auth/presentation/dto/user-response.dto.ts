import { UserResponse } from '@/auth/application/mappers/user.mapper';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto implements UserResponse {
  @ApiProperty({
    description: 'ID do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'ihury@graodireto.com.br',
  })
  email!: string;

  @ApiProperty({
    description: 'Nome de exibição do usuário',
    example: 'Ihury Kewin',
  })
  display_name!: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
