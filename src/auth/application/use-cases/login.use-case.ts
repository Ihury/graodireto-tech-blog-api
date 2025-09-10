import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { TokenServicePort } from '../../domain/ports/token.service.port';
import { AuthenticationService } from '../../domain/services/authentication.service';
import { Email } from '@/common/domain/value-objects';
import { TokenPayload } from '../../domain/entities/token-payload.entity';
import { UserMapper, UserResponse } from '../mappers/user.mapper';
import { InvalidCredentialsError, InvalidValueObjectError } from '@/common';

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResult {
  access_token: string;
  user: UserResponse;
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly tokenService: TokenServicePort,
    private readonly authService: AuthenticationService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    try {
      const email = Email.create(command.email);

      // Obter usuário
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new InvalidCredentialsError();
      }

      // Validar credenciais
      const isValidCredentials = await this.authService.validateCredentials(
        user,
        command.password,
      );
      if (!isValidCredentials) {
        throw new InvalidCredentialsError();
      }

      // Atualizar último login
      user.updateLastLogin();
      await this.userRepository.save(user);

      // Gerar token
      const payload = TokenPayload.create({
        sub: user.getId(),
        email: user.getEmail(),
        displayName: user.getDisplayName(),
      });

      const accessToken = await this.tokenService.sign(payload);

      const userData = UserMapper.toResponse(user);

      return {
        access_token: accessToken.getValue(),
        user: userData,
      };
    } catch (error) {
      if (error instanceof InvalidValueObjectError) {
        throw new UnauthorizedException('Dados inválidos fornecidos.');
      }
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }
}
