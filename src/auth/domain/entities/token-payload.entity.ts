import { Email, DisplayName, Uuid } from '@/common/domain/value-objects';

export interface TokenPayloadProps {
  sub: Uuid;
  email: Email;
  displayName: DisplayName;
  iat?: number;
  exp?: number;
}

export class TokenPayload {
  private constructor(private readonly props: TokenPayloadProps) {}

  static create(props: TokenPayloadProps): TokenPayload {
    return new TokenPayload(props);
  }

  static reconstitute(props: TokenPayloadProps): TokenPayload {
    return new TokenPayload(props);
  }

  getSubject(): Uuid {
    return this.props.sub;
  }

  getEmail(): Email {
    return this.props.email;
  }

  getDisplayName(): DisplayName {
    return this.props.displayName;
  }

  getIssuedAt(): number | undefined {
    return this.props.iat;
  }

  getExpiresAt(): number | undefined {
    return this.props.exp;
  }

  isExpired(): boolean {
    if (!this.props.exp) return false;
    return Date.now() / 1000 > this.props.exp;
  }

  toPlainObject() {
    const payload: any = {
      sub: this.props.sub.getValue(),
      email: this.props.email.getValue(),
      display_name: this.props.displayName.getValue()
    };

    if (this.props.iat !== undefined) {
      payload.iat = this.props.iat;
    }
    if (this.props.exp !== undefined) {
      payload.exp = this.props.exp;
    }

    return payload;
  }
}
