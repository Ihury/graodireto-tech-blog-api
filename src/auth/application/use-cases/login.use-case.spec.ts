import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from './login.use-case';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { TokenServicePort } from '../../domain/ports/token.service.port';
import { AuthenticationService } from '../../domain/services/authentication.service';
import { User } from '../../domain/entities/user.entity';
import { TokenPayload } from '../../domain/entities/token-payload.entity';
import { Email, DisplayName, Uuid } from '@/common/domain/value-objects';
import { PasswordHash } from '../../domain/value-objects/password-hash.vo';
import { AccessToken } from '../../domain/value-objects/access-token.vo';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let tokenService: jest.Mocked<TokenServicePort>;
  let authService: jest.Mocked<AuthenticationService>;

  const mockUser = User.reconstitute({
    id: Uuid.create('7b6347d5-eea6-45d1-82a0-d0732a0d430e'),
    email: Email.create('ihury@graodireto.com.br'),
    passwordHash: PasswordHash.create('$2b$12$hashedpassword'),
    displayName: DisplayName.create('Ihury Kewin'),
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  });

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
    };

    const mockTokenService = {
      sign: jest.fn(),
    };

    const mockAuthService = {
      validateCredentials: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: UserRepositoryPort,
          useValue: mockUserRepository,
        },
        {
          provide: TokenServicePort,
          useValue: mockTokenService,
        },
        {
          provide: AuthenticationService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
    userRepository = module.get(UserRepositoryPort);
    tokenService = module.get(TokenServicePort);
    authService = module.get(AuthenticationService);
  });

  describe('execute', () => {
    const validCommand = {
      email: 'ihury@graodireto.com.br',
      password: 'techblog123',
    };

    describe('orquestração do fluxo de login', () => {
      it('deve orquestrar login com sucesso', async () => {
        // Arrange
        const mockAccessToken = AccessToken.create('jwt.token.here');
        const userSpy = jest.spyOn(mockUser, 'updateLastLogin');

        userRepository.findByEmail.mockResolvedValue(mockUser);
        authService.validateCredentials.mockResolvedValue(true);
        userRepository.save.mockResolvedValue(mockUser);
        tokenService.sign.mockResolvedValue(mockAccessToken);

        // Act
        const result = await useCase.execute(validCommand);

        // Assert
        expect(userRepository.findByEmail).toHaveBeenCalledWith(
          expect.objectContaining({ value: 'ihury@graodireto.com.br' }),
        );
        expect(authService.validateCredentials).toHaveBeenCalledWith(
          mockUser,
          'techblog123',
        );
        expect(userSpy).toHaveBeenCalled();
        expect(userRepository.save).toHaveBeenCalledWith(mockUser);
        expect(tokenService.sign).toHaveBeenCalledWith(
          expect.any(TokenPayload),
        );

        // Assert
        expect(result).toEqual({
          access_token: 'jwt.token.here',
          user: {
            id: '7b6347d5-eea6-45d1-82a0-d0732a0d430e',
            email: 'ihury@graodireto.com.br',
            display_name: 'Ihury Kewin',
          },
        });
      });

      it('deve parar orquestração quando usuário não existe', async () => {
        // Arrange
        userRepository.findByEmail.mockResolvedValue(null);

        // Act & Assert
        await expect(useCase.execute(validCommand)).rejects.toThrow(
          UnauthorizedException,
        );

        expect(userRepository.findByEmail).toHaveBeenCalled();
        expect(authService.validateCredentials).not.toHaveBeenCalled();
        expect(userRepository.save).not.toHaveBeenCalled();
        expect(tokenService.sign).not.toHaveBeenCalled();
      });

      it('deve parar orquestração quando authService retorna false', async () => {
        // Arrange
        userRepository.findByEmail.mockResolvedValue(mockUser);
        authService.validateCredentials.mockResolvedValue(false);

        // Act & Assert
        await expect(useCase.execute(validCommand)).rejects.toThrow(
          UnauthorizedException,
        );

        expect(userRepository.findByEmail).toHaveBeenCalled();
        expect(authService.validateCredentials).toHaveBeenCalled();
        expect(userRepository.save).not.toHaveBeenCalled();
        expect(tokenService.sign).not.toHaveBeenCalled();
      });
    });

    describe('mapeamento de erros de domínio para HTTP', () => {
      it('deve mapear InvalidValueObjectError para UnauthorizedException', async () => {
        // Arrange
        const invalidCommand = {
          email: 'invalid-email',
          password: 'techblog123',
        };

        // Act & Assert
        await expect(useCase.execute(invalidCommand)).rejects.toThrow(
          UnauthorizedException,
        );

        expect(userRepository.findByEmail).not.toHaveBeenCalled();
      });
    });
  });
});
