import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'ihury@graodireto.com.br',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @Transform(({ value }): string =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email!: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'techblog123',
    minLength: 6,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password!: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Token de acesso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  access_token!: string;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
    type: UserResponseDto,
  })
  @Expose()
  @Type(() => UserResponseDto)
  user!: UserResponseDto;

  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }
}
