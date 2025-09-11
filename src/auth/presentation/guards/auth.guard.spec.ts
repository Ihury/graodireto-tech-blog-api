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
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Missing Bearer token',
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
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Missing Bearer token',
      );
      expect(validateTokenUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve negar acesso quando token não tem prefixo Bearer', async () => {
      // Arrange
      const context = createMockExecutionContext({
        authorization: 'InvalidPrefix token-here',
      });

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Missing Bearer token',
      );
      expect(validateTokenUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve negar acesso quando token está vazio após Bearer', async () => {
      // Arrange
      const context = createMockExecutionContext({
        authorization: 'Bearer ',
      });

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Missing Bearer token',
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

    it('deve negar acesso para token expirado', async () => {
      // Arrange
      const expiredToken = 'expired-token';
      const context = createMockExecutionContext({
        authorization: `Bearer ${expiredToken}`,
      });

      validateTokenUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Token expirado ou inválido'),
      );

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(validateTokenUseCase.execute).toHaveBeenCalledWith({
        token: expiredToken,
      });
    });

    it('deve negar acesso quando usuário do token não existe', async () => {
      // Arrange
      const validFormatToken = 'valid-format-token';
      const context = createMockExecutionContext({
        authorization: `Bearer ${validFormatToken}`,
      });

      validateTokenUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Usuário do token não encontrado'),
      );

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(validateTokenUseCase.execute).toHaveBeenCalledWith({
        token: validFormatToken,
      });
    });

    it('deve negar acesso quando usuário está inativo', async () => {
      // Arrange
      const validToken = 'valid-token-inactive-user';
      const context = createMockExecutionContext({
        authorization: `Bearer ${validToken}`,
      });

      validateTokenUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Usuário inativo'),
      );

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(validateTokenUseCase.execute).toHaveBeenCalledWith({
        token: validToken,
      });
    });

    it('deve extrair token corretamente de diferentes formatos Bearer', async () => {
      const testCases = [
        {
          header: 'Bearer token123',
          expectedToken: 'token123',
        },
        {
          header: 'Bearer   token-with-spaces-around  ',
          expectedToken: '  token-with-spaces-around  ',
        },
        {
          header:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          expectedToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
      ];

      for (const testCase of testCases) {
        // Arrange
        const context = createMockExecutionContext({
          authorization: testCase.header,
        });
        validateTokenUseCase.execute.mockResolvedValue(mockValidateTokenResult);

        // Act
        await guard.canActivate(context);

        // Assert
        expect(validateTokenUseCase.execute).toHaveBeenCalledWith({
          token: testCase.expectedToken,
        });

        // Reset mock
        validateTokenUseCase.execute.mockReset();
      }
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
      expect(mockRequest.user.display_name).toBe('Tech Blog');
    });

    it('deve ser case-insensitive para header Authorization', async () => {
      // Arrange - usando header em minúsculo
      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });
      const mockRequest = context.switchToHttp().getRequest();
      // Simula diferentes cases que podem vir do HTTP
      mockRequest.header.mockImplementation((key: string) => {
        if (key.toLowerCase() === 'authorization') {
          return 'Bearer valid-token';
        }
        return undefined;
      });

      validateTokenUseCase.execute.mockResolvedValue(mockValidateTokenResult);

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(mockRequest.header).toHaveBeenCalledWith('authorization');
      expect(validateTokenUseCase.execute).toHaveBeenCalledWith({
        token: 'valid-token',
      });
    });
  });
});
