import { AccessToken } from '../value-objects/access-token.vo';
import { TokenPayload } from '../entities/token-payload.entity';

export interface TokenSignOptions {
  expiresIn?: string | number;
}

export abstract class TokenServicePort {
  abstract sign(
    payload: TokenPayload,
    options?: TokenSignOptions,
  ): Promise<AccessToken>;
  abstract verify(token: AccessToken): Promise<TokenPayload>;
}
