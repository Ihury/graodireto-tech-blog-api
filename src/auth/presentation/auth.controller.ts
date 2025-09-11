import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { ValidateTokenResponseDto } from './dto/validate-token.dto';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { AuthGuard } from './guards/auth.guard';
import type { AuthenticatedRequest } from './guards/auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  @ApiOperation({ summary: 'Realizar login' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return await this.loginUseCase.execute(dto);
  }

  @Get('validate')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Validar token de acesso' })
  @ApiResponse({
    status: 200,
    description: 'Token válido',
    type: ValidateTokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  validate(@Request() req: AuthenticatedRequest): ValidateTokenResponseDto {
    // O AuthGuard já validou o token e populou req.user
    return {
      valid: true,
      user: req.user!,
    };
  }
}
