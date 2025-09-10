import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { Email, DisplayName, Uuid } from '@/common/domain/value-objects';
import { PasswordHash } from '../../domain/value-objects/password-hash.vo';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: Email): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email: email.getValue() },
    });

    return userData ? this.toDomain(userData) : null;
  }

  async findById(id: Uuid): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { id: id.getValue() },
    });

    return userData ? this.toDomain(userData) : null;
  }

  async save(user: User): Promise<User> {
    const plainUser = user.toPlainObject();

    const userData = await this.prisma.user.upsert({
      where: { id: plainUser.id },
      update: {
        email: plainUser.email,
        password_hash: plainUser.password_hash,
        display_name: plainUser.display_name,
        avatar_url: plainUser.avatar_url,
        is_active: plainUser.is_active,
        last_login_at: plainUser.last_login_at,
        updated_at: plainUser.updated_at,
      },
      create: plainUser,
    });

    return this.toDomain(userData);
  }

  async delete(id: Uuid): Promise<void> {
    await this.prisma.user.delete({
      where: { id: id.getValue() },
    });
  }

  private toDomain(userData: {
    id: string;
    email: string;
    password_hash: string;
    display_name: string;
    avatar_url: string | null;
    is_active: boolean;
    last_login_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }): User {
    return User.reconstitute({
      id: Uuid.create(userData.id),
      email: Email.create(userData.email),
      passwordHash: PasswordHash.create(userData.password_hash),
      displayName: DisplayName.create(userData.display_name),
      avatarUrl: userData.avatar_url ?? undefined,
      isActive: userData.is_active,
      lastLoginAt: userData.last_login_at ?? undefined,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
    });
  }
}
