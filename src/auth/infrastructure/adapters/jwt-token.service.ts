import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  TokenServicePort,
  TokenSignOptions,
} from '../../domain/ports/token.service.port';
import { AccessToken } from '../../domain/value-objects/access-token.vo';
import { TokenPayload } from '../../domain/entities/token-payload.entity';
import { Email, DisplayName, Uuid } from '@/common/domain/value-objects';

@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(private readonly jwt: JwtService) {}

  async sign(
    payload: TokenPayload,
    options?: TokenSignOptions,
  ): Promise<AccessToken> {
    const plainPayload = payload.toPlainObject();
    const token = await this.jwt.signAsync(plainPayload, options);
    return AccessToken.create(token);
  }

  async verify(token: AccessToken): Promise<TokenPayload> {
    interface JwtPayload {
      sub: string;
      email: string;
      display_name: string;
      iat?: number;
      exp?: number;
    }

    const decoded = await this.jwt.verifyAsync<JwtPayload>(token.getValue());

    return TokenPayload.create({
      sub: Uuid.create(decoded.sub),
      email: Email.create(decoded.email),
      displayName: DisplayName.create(decoded.display_name),
      iat: decoded.iat,
      exp: decoded.exp,
    });
  }
}
