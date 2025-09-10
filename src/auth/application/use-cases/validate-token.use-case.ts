import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { TokenServicePort } from '../../domain/ports/token.service.port';
import { TokenValidationService } from '../../domain/services/token-validation.service';
import { AccessToken } from '../../domain/value-objects/access-token.vo';
import { UserMapper, UserResponse } from '../mappers/user.mapper';
import {
  InvalidTokenError,
  InvalidValueObjectError,
  UserNotFoundError,
  InactiveUserError,
} from '@/common';

export interface ValidateTokenCommand {
  token: string;
}

export interface ValidateTokenResult {
  valid: boolean;
  user: UserResponse;
}

@Injectable()
export class ValidateTokenUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly tokenService: TokenServicePort,
    private readonly tokenValidationService: TokenValidationService,
  ) {}

  async execute(command: ValidateTokenCommand): Promise<ValidateTokenResult> {
    try {
      // Validar formato do token
      const accessToken = AccessToken.create(command.token);

      // Verificar token
      const payload = await this.tokenService.verify(accessToken);

      // Validar payload do token
      if (!this.tokenValidationService.validateTokenPayload(payload)) {
        throw new InvalidTokenError('Token expirado ou inválido');
      }

      // Buscar usuário
      const user = await this.userRepository.findById(payload.getSubject());
      if (!user) {
        throw new UserNotFoundError('Usuário do token não encontrado');
      }

      // Validar se usuário está ativo
      if (!user.isUserActive()) {
        throw new InactiveUserError('Usuário inativo');
      }

      // Validar se o token pertence ao usuário
      if (!user.getId().equals(payload.getSubject())) {
        throw new InvalidTokenError('Token não pertence ao usuário');
      }

      const userData = UserMapper.toResponse(user);

      return {
        valid: true,
        user: userData,
      };
    } catch (error) {
      if (error instanceof InvalidValueObjectError) {
        throw new UnauthorizedException('Formato de token inválido');
      }
      if (error instanceof InvalidTokenError) {
        throw new UnauthorizedException(error.message);
      }
      if (error instanceof UserNotFoundError) {
        throw new UnauthorizedException(error.message);
      }
      if (error instanceof InactiveUserError) {
        throw new UnauthorizedException(error.message);
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido');
    }
  }
}
