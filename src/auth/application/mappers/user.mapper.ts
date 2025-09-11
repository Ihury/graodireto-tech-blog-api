import { User } from '../../domain/entities/user.entity';

export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export class UserMapper {
  static toResponse(user: User): UserResponse {
    return {
      id: user.getId().getValue(),
      email: user.getEmail().getValue(),
      displayName: user.getDisplayName().getValue(),
      avatarUrl: user.getAvatarUrl(),
    };
  }
}
