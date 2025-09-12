import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { ValidateTokenUseCase } from '../../application/use-cases/validate-token.use-case';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let validateTokenUseCase: jest.Mocked<ValidateTokenUseCase>;

  const mockUser = {
    id: '7b6347d5-eea6-45d1-82a0-d0732a0d430e',
    email: 'ihury@graodireto.com.br',
    displayName: 'Ihury Kewin',
    avatarUrl: undefined,
  };

  const mockValidateTokenResult = {
    valid: true,
    user: mockUser,
  };

  beforeEach(async () => {
    const mockValidateTokenUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: ValidateTokenUseCase,
          useValue: mockValidateTokenUseCase,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    validateTokenUseCase = module.get(ValidateTokenUseCase);
  });

  const createMockExecutionContext = (headers: any = {}): ExecutionContext => {
    const mockRequest = {
      header: jest.fn((key: string) => headers[key.toLowerCase()]),
      headers,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;
  };

  describe('canActivate', () => {
    it('deve permitir acesso para token Bearer válido', async () => {
      // Arrange
      const validToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YjYzNDdkNS1lZWE2LTQ1ZDEtODJhMC1kMDczMmEwZDQzMGUiLCJlbWFpbCI6ImlocnlAZ3Jhb2RpcmV0by5jb20uYnIiLCJkaXNwbGF5X25hbWUiOiJJaHVyeSBLZXdpbiJ9.token';
      const context = createMockExecutionContext({
        authorization: `Bearer ${validToken}`,
      });
      const mockRequest = context.switchToHttp().getRequest();

      validateTokenUseCase.execute.mockResolvedValue(mockValidateTokenResult);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(validateTokenUseCase.execute).toHaveBeenCalledWith({
        token: validToken,
      });
      expect(mockRequest.user).toEqual(mockUser);
    });

    it('deve negar acesso quando header Authorization está ausente', async () => {
      // Arrange
      const context = createMockExecutionContext({});

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(validateTokenUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve negar acesso quando header Authorization está vazio', async () => {
      // Arrange
      const context = createMockExecutionContext({
        authorization: '',
      });

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(validateTokenUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve negar acesso para token inválido', async () => {
      // Arrange
      const invalidToken = 'invalid-token';
      const context = createMockExecutionContext({
        authorization: `Bearer ${invalidToken}`,
      });

      validateTokenUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Token inválido'),
      );

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(validateTokenUseCase.execute).toHaveBeenCalledWith({
        token: invalidToken,
      });
    });

    it('deve popular req.user com dados corretos do token', async () => {
      // Arrange
      const differentUser = {
        id: 'c626a9ac-c0dc-4223-9acc-72ed8fbe6776',
        email: 'tech@graodireto.com.br',
        displayName: 'Tech Blog',
        avatarUrl: undefined,
      };
      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });
      const mockRequest = context.switchToHttp().getRequest();

      validateTokenUseCase.execute.mockResolvedValue({
        valid: true,
        user: differentUser,
      });

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(mockRequest.user).toEqual(differentUser);
      expect(mockRequest.user.id).toBe('c626a9ac-c0dc-4223-9acc-72ed8fbe6776');
      expect(mockRequest.user.email).toBe('tech@graodireto.com.br');
      expect(mockRequest.user.displayName).toBe('Tech Blog');
    });
  });
});
