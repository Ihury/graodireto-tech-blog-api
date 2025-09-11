import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ValidateTokenUseCase } from './validate-token.use-case';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { TokenServicePort } from '../../domain/ports/token.service.port';
import { TokenValidationService } from '../../domain/services/token-validation.service';
import { User } from '../../domain/entities/user.entity';
import { TokenPayload } from '../../domain/entities/token-payload.entity';
import { Email, DisplayName, Uuid } from '@/common/domain/value-objects';
import { PasswordHash } from '../../domain/value-objects/password-hash.vo';
import { AccessToken } from '../../domain/value-objects/access-token.vo';
import {
  InvalidTokenError,
  UserNotFoundError,
  InactiveUserError,
} from '@/common';

describe('ValidateTokenUseCase', () => {
  let useCase: ValidateTokenUseCase;
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let tokenService: jest.Mocked<TokenServicePort>;
  let tokenValidationService: jest.Mocked<TokenValidationService>;

  const mockUserId = Uuid.create('7b6347d5-eea6-45d1-82a0-d0732a0d430e');
  const mockEmail = Email.create('ihury@graodireto.com.br');
  const mockDisplayName = DisplayName.create('Ihury Kewin');

  const mockUser = User.reconstitute({
    id: mockUserId,
    email: mockEmail,
    passwordHash: PasswordHash.create('$2b$12$hashedpassword'),
    displayName: mockDisplayName,
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  });

  const mockTokenPayload = TokenPayload.create({
    sub: mockUserId,
    email: mockEmail,
    displayName: mockDisplayName,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
  });

  beforeEach(async () => {
    const mockUserRepository = {
      findById: jest.fn(),
    };

    const mockTokenService = {
      verify: jest.fn(),
    };

    const mockTokenValidationService = {
      validateTokenPayload: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateTokenUseCase,
        {
          provide: UserRepositoryPort,
          useValue: mockUserRepository,
        },
        {
          provide: TokenServicePort,
          useValue: mockTokenService,
        },
        {
          provide: TokenValidationService,
          useValue: mockTokenValidationService,
        },
      ],
    }).compile();

    useCase = module.get<ValidateTokenUseCase>(ValidateTokenUseCase);
    userRepository = module.get(UserRepositoryPort);
    tokenService = module.get(TokenServicePort);
    tokenValidationService = module.get(TokenValidationService);
  });

  describe('execute', () => {
    const validCommand = {
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YjYzNDdkNS1lZWE2LTQ1ZDEtODJhMC1kMDczMmEwZDQzMGUiLCJlbWFpbCI6ImlocnlAZ3Jhb2RpcmV0by5jb20uYnIiLCJkaXNwbGF5X25hbWUiOiJJaHVyeSBLZXdpbiJ9.token',
    };

    describe('orquestração do fluxo de validação', () => {
      it('deve orquestrar validação de token com sucesso', async () => {
        // Arrange
        tokenService.verify.mockResolvedValue(mockTokenPayload);
        tokenValidationService.validateTokenPayload.mockReturnValue(true);
        userRepository.findById.mockResolvedValue(mockUser);

        // Act
        const result = await useCase.execute(validCommand);

        // Assert
        expect(tokenService.verify).toHaveBeenCalledWith(
          expect.any(AccessToken),
        );
        expect(
          tokenValidationService.validateTokenPayload,
        ).toHaveBeenCalledWith(mockTokenPayload);
        expect(userRepository.findById).toHaveBeenCalledWith(mockUserId);

        // Assert
        expect(result).toEqual({
          valid: true,
          user: {
            id: '7b6347d5-eea6-45d1-82a0-d0732a0d430e',
            email: 'ihury@graodireto.com.br',
            displayName: 'Ihury Kewin',
            avatarUrl: undefined,
          },
        });
      });

      it('deve parar orquestração quando tokenValidationService retorna false', async () => {
        // Arrange
        tokenService.verify.mockResolvedValue(mockTokenPayload);
        tokenValidationService.validateTokenPayload.mockReturnValue(false);

        // Act & Assert
        await expect(useCase.execute(validCommand)).rejects.toThrow(
          UnauthorizedException,
        );

        expect(tokenService.verify).toHaveBeenCalled();
        expect(tokenValidationService.validateTokenPayload).toHaveBeenCalled();
        expect(userRepository.findById).not.toHaveBeenCalled();
      });

      it('deve parar orquestração quando usuário não existe', async () => {
        // Arrange
        tokenService.verify.mockResolvedValue(mockTokenPayload);
        tokenValidationService.validateTokenPayload.mockReturnValue(true);
        userRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(useCase.execute(validCommand)).rejects.toThrow(
          UnauthorizedException,
        );

        expect(tokenService.verify).toHaveBeenCalled();
        expect(tokenValidationService.validateTokenPayload).toHaveBeenCalled();
        expect(userRepository.findById).toHaveBeenCalledWith(mockUserId);
      });

      it('deve parar orquestração quando usuário está inativo', async () => {
        // Arrange
        const inactiveUser = User.reconstitute({
          ...mockUser.toPlainObject(),
          id: mockUserId,
          email: mockEmail,
          passwordHash: PasswordHash.create('$2b$12$hashedpassword'),
          displayName: mockDisplayName,
          isActive: false,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        });

        tokenService.verify.mockResolvedValue(mockTokenPayload);
        tokenValidationService.validateTokenPayload.mockReturnValue(true);
        userRepository.findById.mockResolvedValue(inactiveUser);

        // Act & Assert
        await expect(useCase.execute(validCommand)).rejects.toThrow(
          UnauthorizedException,
        );

        expect(tokenService.verify).toHaveBeenCalled();
        expect(tokenValidationService.validateTokenPayload).toHaveBeenCalled();
        expect(userRepository.findById).toHaveBeenCalled();
      });
    });

    describe('mapeamento de erros de domínio para HTTP', () => {
      it('deve mapear InvalidValueObjectError para UnauthorizedException', async () => {
        // Arrange
        const invalidCommand = {
          token: 'invalid-token-format',
        };

        // Act & Assert
        await expect(useCase.execute(invalidCommand)).rejects.toThrow(
          UnauthorizedException,
        );

        expect(userRepository.findById).not.toHaveBeenCalled();
      });

      it('deve mapear InvalidTokenError para UnauthorizedException', async () => {
        // Arrange
        tokenService.verify.mockResolvedValue(mockTokenPayload);
        tokenValidationService.validateTokenPayload.mockImplementation(() => {
          throw new InvalidTokenError('Token expirado');
        });

        // Act & Assert
        const exception = await useCase.execute(validCommand).catch((e) => e);

        expect(exception).toBeInstanceOf(UnauthorizedException);
        expect(exception.message).toBe('Token expirado');
      });

      it('deve mapear UserNotFoundError para UnauthorizedException', async () => {
        // Arrange
        tokenService.verify.mockResolvedValue(mockTokenPayload);
        tokenValidationService.validateTokenPayload.mockReturnValue(true);
        userRepository.findById.mockImplementation(() => {
          throw new UserNotFoundError('Usuário não encontrado no sistema');
        });

        // Act & Assert
        const exception = await useCase.execute(validCommand).catch((e) => e);

        expect(exception).toBeInstanceOf(UnauthorizedException);
        expect(exception.message).toBe('Usuário não encontrado no sistema');
      });

      it('deve mapear InactiveUserError para UnauthorizedException', async () => {
        // Arrange
        tokenService.verify.mockResolvedValue(mockTokenPayload);
        tokenValidationService.validateTokenPayload.mockReturnValue(true);
        userRepository.findById.mockImplementation(() => {
          throw new InactiveUserError('Conta desativada');
        });

        // Act & Assert
        const exception = await useCase.execute(validCommand).catch((e) => e);

        expect(exception).toBeInstanceOf(UnauthorizedException);
        expect(exception.message).toBe('Conta desativada');
      });

      it('deve mapear erros gerais de verificação para UnauthorizedException', async () => {
        // Arrange
        tokenService.verify.mockRejectedValue(
          new Error('Token verification failed'),
        );

        // Act & Assert
        await expect(useCase.execute(validCommand)).rejects.toThrow(
          UnauthorizedException,
        );

        expect(
          tokenValidationService.validateTokenPayload,
        ).not.toHaveBeenCalled();
        expect(userRepository.findById).not.toHaveBeenCalled();
      });
    });
  });
});
