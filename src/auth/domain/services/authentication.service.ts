import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { verifyPassword } from '../../../common/security/password.util';

@Injectable()
export class AuthenticationService {
  async validateCredentials(
    user: User,
    plainPassword: string,
  ): Promise<boolean> {
    if (!user.isUserActive()) {
      return false;
    }

    return await verifyPassword(
      plainPassword,
      user.getPasswordHash().getValue(),
    );
  }

  isUserEligibleForLogin(user: User | null): boolean {
    if (!user) {
      return false;
    }

    return user.isUserActive();
  }
}
