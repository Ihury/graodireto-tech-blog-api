import { Email, DisplayName, Uuid } from '@/common/domain/value-objects';
import { PasswordHash } from '../value-objects/password-hash.vo';

export interface UserProps {
  id: Uuid;
  email: Email;
  passwordHash: PasswordHash;
  displayName: DisplayName;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(
    props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'> & { id?: Uuid },
  ): User {
    const now = new Date();

    return new User({
      ...props,
      id: props.id || Uuid.create(crypto.randomUUID()),
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // Getters
  getId(): Uuid {
    return this.props.id;
  }

  getEmail(): Email {
    return this.props.email;
  }

  getPasswordHash(): PasswordHash {
    return this.props.passwordHash;
  }

  getDisplayName(): DisplayName {
    return this.props.displayName;
  }

  getAvatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }

  isUserActive(): boolean {
    return this.props.isActive;
  }

  getLastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  activate(): void {
    this.props.isActive = true;
    this.updateTimestamp();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.updateTimestamp();
  }

  updateLastLogin(): void {
    this.props.lastLoginAt = new Date();
    this.updateTimestamp();
  }

  changeDisplayName(newDisplayName: DisplayName): void {
    this.props.displayName = newDisplayName;
    this.updateTimestamp();
  }

  changeAvatarUrl(avatarUrl?: string): void {
    this.props.avatarUrl = avatarUrl;
    this.updateTimestamp();
  }

  private updateTimestamp(): void {
    this.props.updatedAt = new Date();
  }

  toPlainObject() {
    return {
      id: this.props.id.getValue(),
      email: this.props.email.getValue(),
      password_hash: this.props.passwordHash.getValue(),
      display_name: this.props.displayName.getValue(),
      avatar_url: this.props.avatarUrl,
      is_active: this.props.isActive,
      last_login_at: this.props.lastLoginAt,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
    };
  }
}
