import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { AuthGuard } from './guards/auth.guard';
import { ValidateTokenUseCase } from '../application/use-cases/validate-token.use-case';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let loginUseCase: jest.Mocked<LoginUseCase>;

  const mockLoginResult = {
    access_token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YjYzNDdkNS1lZWE2LTQ1ZDEtODJhMC1kMDczMmEwZDQzMGUiLCJlbWFpbCI6ImlocnlAZ3Jhb2RpcmV0by5jb20uYnIiLCJkaXNwbGF5X25hbWUiOiJJaHVyeSBLZXdpbiJ9.token',
    user: {
      id: '7b6347d5-eea6-45d1-82a0-d0732a0d430e',
      email: 'ihury@graodireto.com.br',
      displayName: 'Ihury Kewin',
    },
  };

  const mockUser = {
    id: '7b6347d5-eea6-45d1-82a0-d0732a0d430e',
    email: 'ihury@graodireto.com.br',
    display_name: 'Ihury Kewin',
  };

  beforeEach(async () => {
    const mockLoginUseCase = {
      execute: jest.fn(),
    };

    const mockValidateTokenUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LoginUseCase,
          useValue: mockLoginUseCase,
        },
        {
          provide: ValidateTokenUseCase,
          useValue: mockValidateTokenUseCase,
        },
        AuthGuard,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    loginUseCase = module.get(LoginUseCase);
  });

  describe('POST /auth/login', () => {
    const validLoginDto: LoginDto = {
      email: 'ihury@graodireto.com.br',
      password: 'techblog123',
    };

    it('deve realizar login com sucesso para credenciais válidas', async () => {
      // Arrange
      loginUseCase.execute.mockResolvedValue(mockLoginResult);

      // Act
      const result = await controller.login(validLoginDto);

      // Assert
      expect(result).toEqual(mockLoginResult);
      expect(loginUseCase.execute).toHaveBeenCalledWith(validLoginDto);
      expect(loginUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('deve lançar UnauthorizedException para credenciais inválidas', async () => {
      // Arrange
      const invalidLoginDto: LoginDto = {
        email: 'ihury@graodireto.com.br',
        password: 'senhaerrada',
      };
      loginUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Credenciais inválidas'),
      );

      // Act & Assert
      await expect(controller.login(invalidLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(loginUseCase.execute).toHaveBeenCalledWith(invalidLoginDto);
    });

    it('deve propagar erros internos do LoginUseCase', async () => {
      // Arrange
      loginUseCase.execute.mockRejectedValue(new Error('Erro interno'));

      // Act & Assert
      await expect(controller.login(validLoginDto)).rejects.toThrow(
        'Erro interno',
      );
      expect(loginUseCase.execute).toHaveBeenCalledWith(validLoginDto);
    });

    it('deve aceitar diferentes formatos de email da Grão Direto', async () => {
      const graoDiretoEmails = [
        'ihury@graodireto.com.br',
        'contato@graodireto.com.br',
        'tech@graodireto.com.br',
        'admin@graodireto.com.br',
      ];

      for (const email of graoDiretoEmails) {
        // Arrange
        const dto: LoginDto = { email, password: 'techblog123' };
        const expectedResult = {
          ...mockLoginResult,
          user: { ...mockLoginResult.user, email },
        };
        loginUseCase.execute.mockResolvedValue(expectedResult);

        // Act
        const result = await controller.login(dto);

        // Assert
        expect(result).toEqual(expectedResult);
        expect(loginUseCase.execute).toHaveBeenCalledWith(dto);
      }
    });
  });

  describe('GET /auth/validate', () => {
    it('deve retornar token válido quando AuthGuard passa', async () => {
      // Arrange
      const mockRequest = {
        user: mockUser,
      } as any;

      // Act
      const result = await controller.validate(mockRequest);

      // Assert
      expect(result).toEqual({
        valid: true,
        user: mockUser,
      });
    });

    it('deve retornar dados do usuário corretos do token', async () => {
      // Arrange
      const differentUser = {
        id: 'c626a9ac-c0dc-4223-9acc-72ed8fbe6776',
        email: 'tech@graodireto.com.br',
        display_name: 'Tech Blog',
      };
      const mockRequest = {
        user: differentUser,
      } as any;

      // Act
      const result = await controller.validate(mockRequest);

      // Assert
      expect(result).toEqual({
        valid: true,
        user: differentUser,
      });
    });
  });
});
