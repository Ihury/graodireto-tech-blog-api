import { User } from '../../domain/entities/user.entity';

export interface UserResponse {
  id: string;
  email: string;
  display_name: string;
}

export class UserMapper {
  static toResponse(user: User): UserResponse {
    return {
      id: user.getId().getValue(),
      email: user.getEmail().getValue(),
      display_name: user.getDisplayName().getValue(),
    };
  }
}
