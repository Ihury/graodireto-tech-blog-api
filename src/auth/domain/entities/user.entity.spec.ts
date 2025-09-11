import { User } from './user.entity';
import { Email, DisplayName, Uuid } from '@/common/domain/value-objects';
import { PasswordHash } from '../value-objects/password-hash.vo';

describe('User Entity', () => {
  const createValidUserProps = () => ({
    email: Email.create('ihury@graodireto.com.br'),
    passwordHash: PasswordHash.create('$2b$12$hashedpassword'),
    displayName: DisplayName.create('Ihury Kewin'),
    isActive: true,
  });

  describe('create', () => {
    it('deve criar usuário com dados válidos', () => {
      // Arrange
      const props = createValidUserProps();

      // Act
      const user = User.create(props);

      // Assert
      expect(user.getEmail().getValue()).toBe('ihury@graodireto.com.br');
      expect(user.getDisplayName().getValue()).toBe('Ihury Kewin');
      expect(user.isUserActive()).toBe(true);
      expect(user.getId()).toBeDefined();
      expect(user.getCreatedAt()).toBeInstanceOf(Date);
      expect(user.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('deve criar usuário com campos opcionais', () => {
      // Arrange
      const props = {
        ...createValidUserProps(),
        avatarUrl: 'https://graodireto.com.br/avatar/ihury.jpg',
        lastLoginAt: new Date('2025-09-10'),
      };

      // Act
      const user = User.create(props);

      // Assert
      expect(user.getAvatarUrl()).toBe(
        'https://graodireto.com.br/avatar/ihury.jpg',
      );
      expect(user.getLastLoginAt()).toEqual(new Date('2025-09-10'));
    });
  });

  describe('reconstitute', () => {
    it('deve reconstituir usuário com todos os dados', () => {
      // Arrange
      const props = {
        id: Uuid.create('7b6347d5-eea6-45d1-82a0-d0732a0d430e'),
        email: Email.create('ihury@graodireto.com.br'),
        passwordHash: PasswordHash.create('$2b$12$hashedpassword'),
        displayName: DisplayName.create('Ihury Kewin'),
        avatarUrl: 'https://graodireto.com.br/avatar/ihury.jpg',
        isActive: true,
        lastLoginAt: new Date('2025-09-10'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-09-10'),
      };

      // Act
      const user = User.reconstitute(props);

      // Assert
      expect(user.getId().getValue()).toBe(
        '7b6347d5-eea6-45d1-82a0-d0732a0d430e',
      );
      expect(user.getEmail().getValue()).toBe('ihury@graodireto.com.br');
      expect(user.getDisplayName().getValue()).toBe('Ihury Kewin');
      expect(user.getAvatarUrl()).toBe(
        'https://graodireto.com.br/avatar/ihury.jpg',
      );
      expect(user.isUserActive()).toBe(true);
      expect(user.getLastLoginAt()).toEqual(new Date('2025-09-10'));
      expect(user.getCreatedAt()).toEqual(new Date('2025-01-01'));
      expect(user.getUpdatedAt()).toEqual(new Date('2025-09-10'));
    });
  });

  describe('business methods', () => {
    let user: User;

    beforeEach(() => {
      user = User.create(createValidUserProps());
    });

    describe('activate', () => {
      it('deve ativar usuário inativo', async () => {
        // Arrange
        const inactiveUser = User.create({
          ...createValidUserProps(),
          isActive: false,
        });
        const originalUpdatedAt = inactiveUser.getUpdatedAt();

        // Aguardar 1ms para garantir diferença no timestamp
        await new Promise((resolve) => setTimeout(resolve, 5));

        // Act
        inactiveUser.activate();

        // Assert
        expect(inactiveUser.isUserActive()).toBe(true);
        expect(inactiveUser.getUpdatedAt().getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });
    });

    describe('deactivate', () => {
      it('deve desativar usuário ativo', async () => {
        // Arrange
        const originalUpdatedAt = user.getUpdatedAt();

        // Aguardar 1ms para garantir diferença no timestamp
        await new Promise((resolve) => setTimeout(resolve, 5));

        // Act
        user.deactivate();

        // Assert
        expect(user.isUserActive()).toBe(false);
        expect(user.getUpdatedAt().getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });
    });

    describe('updateLastLogin', () => {
      it('deve atualizar último login', async () => {
        // Arrange
        const originalUpdatedAt = user.getUpdatedAt();
        const originalLastLogin = user.getLastLoginAt();

        // Aguardar 1ms para garantir diferença no timestamp
        await new Promise((resolve) => setTimeout(resolve, 5));

        // Act
        user.updateLastLogin();

        // Assert
        expect(user.getLastLoginAt()).toBeInstanceOf(Date);
        expect(user.getLastLoginAt()!.getTime()).toBeGreaterThan(
          originalLastLogin?.getTime() || 0,
        );
        expect(user.getUpdatedAt().getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });
    });

    describe('changeDisplayName', () => {
      it('deve alterar display name', async () => {
        // Arrange
        const newDisplayName = DisplayName.create('Grão Direto Tech');
        const originalUpdatedAt = user.getUpdatedAt();

        // Aguardar 1ms para garantir diferença no timestamp
        await new Promise((resolve) => setTimeout(resolve, 5));

        // Act
        user.changeDisplayName(newDisplayName);

        // Assert
        expect(user.getDisplayName().getValue()).toBe('Grão Direto Tech');
        expect(user.getUpdatedAt().getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });
    });

    describe('changeAvatarUrl', () => {
      it('deve alterar avatar URL', async () => {
        // Arrange
        const newAvatarUrl = 'https://graodireto.com.br/avatar/new.jpg';
        const originalUpdatedAt = user.getUpdatedAt();

        // Aguardar 1ms para garantir diferença no timestamp
        await new Promise((resolve) => setTimeout(resolve, 5));

        // Act
        user.changeAvatarUrl(newAvatarUrl);

        // Assert
        expect(user.getAvatarUrl()).toBe(
          'https://graodireto.com.br/avatar/new.jpg',
        );
        expect(user.getUpdatedAt().getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      });

      it('deve remover avatar URL quando undefined', () => {
        // Arrange
        const userWithAvatar = User.create({
          ...createValidUserProps(),
          avatarUrl: 'https://graodireto.com.br/avatar/old.jpg',
        });

        // Act
        userWithAvatar.changeAvatarUrl(undefined);

        // Assert
        expect(userWithAvatar.getAvatarUrl()).toBeUndefined();
      });
    });
  });

  describe('toPlainObject', () => {
    it('deve converter para objeto plano com formato correto', () => {
      // Arrange
      const user = User.reconstitute({
        id: Uuid.create('7b6347d5-eea6-45d1-82a0-d0732a0d430e'),
        email: Email.create('ihury@graodireto.com.br'),
        passwordHash: PasswordHash.create('$2b$12$hashedpassword'),
        displayName: DisplayName.create('Ihury Kewin'),
        avatarUrl: 'https://graodireto.com.br/avatar/ihury.jpg',
        isActive: true,
        lastLoginAt: new Date('2025-09-10'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-09-10'),
      });

      // Act
      const plainObject = user.toPlainObject();

      // Assert
      expect(plainObject).toEqual({
        id: '7b6347d5-eea6-45d1-82a0-d0732a0d430e',
        email: 'ihury@graodireto.com.br',
        password_hash: '$2b$12$hashedpassword',
        display_name: 'Ihury Kewin',
        avatar_url: 'https://graodireto.com.br/avatar/ihury.jpg',
        is_active: true,
        last_login_at: new Date('2025-09-10'),
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-09-10'),
      });
    });

    it('deve converter para objeto plano com campos opcionais undefined', () => {
      // Arrange
      const user = User.create(createValidUserProps());

      // Act
      const plainObject = user.toPlainObject();

      // Assert
      expect(plainObject.avatar_url).toBeUndefined();
      expect(plainObject.last_login_at).toBeUndefined();
      expect(plainObject.id).toBeDefined();
      expect(plainObject.created_at).toBeInstanceOf(Date);
      expect(plainObject.updated_at).toBeInstanceOf(Date);
    });
  });
});
