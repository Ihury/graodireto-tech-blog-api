import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { User } from '../entities/user.entity';
import { Email, DisplayName, Uuid } from '@/common/domain/value-objects';
import { PasswordHash } from '../value-objects/password-hash.vo';
import * as passwordUtil from '../../../common/security/password.util';

// Mock do módulo password.util
jest.mock('../../../common/security/password.util');

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let mockVerifyPassword: jest.MockedFunction<
    typeof passwordUtil.verifyPassword
  >;

  const createMockUser = (isActive = true) => {
    return User.reconstitute({
      id: Uuid.create('7b6347d5-eea6-45d1-82a0-d0732a0d430e'),
      email: Email.create('ihury@graodireto.com.br'),
      passwordHash: PasswordHash.create('$2b$12$hashedpassword'),
      displayName: DisplayName.create('Ihury Kewin'),
      isActive,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthenticationService],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    mockVerifyPassword = passwordUtil.verifyPassword as jest.MockedFunction<
      typeof passwordUtil.verifyPassword
    >;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('validateCredentials', () => {
    it('deve retornar true para usuário ativo com senha correta', async () => {
      // Arrange
      const user = createMockUser(true);
      const plainPassword = 'techblog123';
      mockVerifyPassword.mockResolvedValue(true);

      // Act
      const result = await service.validateCredentials(user, plainPassword);

      // Assert
      expect(result).toBe(true);
      expect(mockVerifyPassword).toHaveBeenCalledWith(
        plainPassword,
        '$2b$12$hashedpassword',
      );
    });

    it('deve retornar false para usuário ativo com senha incorreta', async () => {
      // Arrange
      const user = createMockUser(true);
      const plainPassword = 'senhaerrada';
      mockVerifyPassword.mockResolvedValue(false);

      // Act
      const result = await service.validateCredentials(user, plainPassword);

      // Assert
      expect(result).toBe(false);
      expect(mockVerifyPassword).toHaveBeenCalledWith(
        plainPassword,
        '$2b$12$hashedpassword',
      );
    });

    it('deve retornar false para usuário inativo mesmo com senha correta', async () => {
      // Arrange
      const user = createMockUser(false);
      const plainPassword = 'techblog123';

      // Act
      const result = await service.validateCredentials(user, plainPassword);

      // Assert
      expect(result).toBe(false);
      // Não deve chamar verifyPassword se usuário está inativo
      expect(mockVerifyPassword).not.toHaveBeenCalled();
    });
  });

  describe('isUserEligibleForLogin', () => {
    it('deve retornar true para usuário ativo', () => {
      // Arrange
      const user = createMockUser(true);

      // Act
      const result = service.isUserEligibleForLogin(user);

      // Assert
      expect(result).toBe(true);
    });

    it('deve retornar false para usuário inativo', () => {
      // Arrange
      const user = createMockUser(false);

      // Act
      const result = service.isUserEligibleForLogin(user);

      // Assert
      expect(result).toBe(false);
    });
  });
});
