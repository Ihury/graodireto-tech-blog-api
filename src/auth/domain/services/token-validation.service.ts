import { Injectable } from '@nestjs/common';
import { TokenPayload } from '../entities/token-payload.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class TokenValidationService {
  validateTokenPayload(payload: TokenPayload): boolean {
    if (payload.isExpired()) {
      return false;
    }

    return true;
  }

  validateUserFromToken(user: User | null, payload: TokenPayload): boolean {
    if (!user) {
      return false;
    }

    if (!user.isUserActive()) {
      return false;
    }

    // Verifica se o token pertence ao usuário
    if (!user.getId().equals(payload.getSubject())) {
      return false;
    }

    return true;
  }
}
