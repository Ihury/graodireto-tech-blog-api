import { Test, TestingModule } from '@nestjs/testing';
import { TokenValidationService } from './token-validation.service';
import { TokenPayload } from '../entities/token-payload.entity';
import { User } from '../entities/user.entity';
import { Email, DisplayName, Uuid } from '@/common/domain/value-objects';
import { PasswordHash } from '../value-objects/password-hash.vo';

describe('TokenValidationService', () => {
  let service: TokenValidationService;

  const mockUserId = Uuid.create('7b6347d5-eea6-45d1-82a0-d0732a0d430e');
  const mockEmail = Email.create('ihury@graodireto.com.br');
  const mockDisplayName = DisplayName.create('Ihury Kewin');

  const createMockUser = (isActive = true, userId = mockUserId) => {
    return User.reconstitute({
      id: userId,
      email: mockEmail,
      passwordHash: PasswordHash.create('$2b$12$hashedpassword'),
      displayName: mockDisplayName,
      isActive,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenValidationService],
    }).compile();

    service = module.get<TokenValidationService>(TokenValidationService);
  });

  describe('validateTokenPayload', () => {
    it('deve retornar true para token payload válido e não expirado', () => {
      // Arrange
      const now = Math.floor(Date.now() / 1000);
      const expiresIn15Min = now + 900; // 15 minutos no futuro

      const validTokenPayload = TokenPayload.create({
        sub: mockUserId,
        email: mockEmail,
        displayName: mockDisplayName,
        iat: now,
        exp: expiresIn15Min,
      });

      // Act
      const result = service.validateTokenPayload(validTokenPayload);

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar true para token payload sem exp (não expira)', () => {
      // Arrange
      const validTokenPayload = TokenPayload.create({
        sub: mockUserId,
        email: mockEmail,
        displayName: mockDisplayName,
        iat: Math.floor(Date.now() / 1000),
      });

      // Act
      const result = service.validateTokenPayload(validTokenPayload);

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar false para token que acabou de expirar', () => {
      // Arrange
      const now = Math.floor(Date.now() / 1000);
      const justExpired = now - 1;

      const justExpiredTokenPayload = TokenPayload.create({
        sub: mockUserId,
        email: mockEmail,
        displayName: mockDisplayName,
        iat: now - 900,
        exp: justExpired,
      });

      // Act
      const result = service.validateTokenPayload(justExpiredTokenPayload);

      // Assert
      expect(result).toBe(false);
    });

    it('deve validar tokens de diferentes usuários', () => {
      const testUsers = [
        {
          id: '7b6347d5-eea6-45d1-82a0-d0732a0d430e',
          email: 'ihury@graodireto.com.br',
          name: 'Ihury Kewin',
        },
        {
          id: 'c626a9ac-c0dc-4223-9acc-72ed8fbe6776',
          email: 'contato@graodireto.com.br',
          name: 'Grão Direto',
        },
        {
          id: '46c4021d-26b6-4b1a-88b6-4e85e6aed7c3',
          email: 'tech@graodireto.com.br',
          name: 'Tech Blog',
        },
      ];

      testUsers.forEach((testUser) => {
        // Arrange
        const now = Math.floor(Date.now() / 1000);
        const tokenPayload = TokenPayload.create({
          sub: Uuid.create(testUser.id),
          email: Email.create(testUser.email),
          displayName: DisplayName.create(testUser.name),
          iat: now,
          exp: now + 900,
        });

        // Act
        const result = service.validateTokenPayload(tokenPayload);

        // Assert
        expect(result).toBe(true);
      });
    });
  });

  describe('validateUserFromToken', () => {
    const createValidTokenPayload = (userId = mockUserId) => {
      const now = Math.floor(Date.now() / 1000);
      return TokenPayload.create({
        sub: userId,
        email: mockEmail,
        displayName: mockDisplayName,
        iat: now,
        exp: now + 900,
      });
    };

    it('deve retornar true para usuário ativo com token correspondente', () => {
      // Arrange
      const user = createMockUser(true, mockUserId);
      const tokenPayload = createValidTokenPayload(mockUserId);

      // Act
      const result = service.validateUserFromToken(user, tokenPayload);

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar false para usuário null', () => {
      // Arrange
      const tokenPayload = createValidTokenPayload();

      // Act
      const result = service.validateUserFromToken(null, tokenPayload);

      // Assert
      expect(result).toBe(false);
    });

    it('deve retornar false para usuário inativo', () => {
      // Arrange
      const inactiveUser = createMockUser(false, mockUserId);
      const tokenPayload = createValidTokenPayload(mockUserId);

      // Act
      const result = service.validateUserFromToken(inactiveUser, tokenPayload);

      // Assert
      expect(result).toBe(false);
    });

    it('deve retornar false quando token não pertence ao usuário', () => {
      // Arrange
      const user = createMockUser(true, mockUserId);
      const differentUserId = Uuid.create(
        'c626a9ac-c0dc-4223-9acc-72ed8fbe6776',
      );
      const tokenPayload = createValidTokenPayload(differentUserId);

      // Act
      const result = service.validateUserFromToken(user, tokenPayload);

      // Assert
      expect(result).toBe(false);
    });
  });
});
