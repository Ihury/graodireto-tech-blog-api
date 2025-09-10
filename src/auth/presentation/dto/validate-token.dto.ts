import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from './user-response.dto';

export class ValidateTokenResponseDto {
  @ApiProperty({
    description: 'Indica se o token é válido',
    example: true,
  })
  @Expose()
  valid!: boolean;

  @ApiProperty({
    description: 'Dados do usuário do token',
    type: UserResponseDto,
  })
  @Expose()
  @Type(() => UserResponseDto)
  user!: UserResponseDto;

  constructor(partial: Partial<ValidateTokenResponseDto>) {
    Object.assign(this, partial);
  }
}
