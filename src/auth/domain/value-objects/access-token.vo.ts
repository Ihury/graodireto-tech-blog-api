import { BaseValueObject } from '@/common';
import { IsNotEmpty, IsString } from 'class-validator';

class AccessTokenValidator {
  @IsNotEmpty({ message: 'AccessToken deve ser uma string não vazia' })
  @IsString({ message: 'AccessToken deve ser uma string não vazia' })
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export class AccessToken extends BaseValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): AccessToken {
    return new AccessToken(value);
  }

  protected createValidator(value: string): object {
    return new AccessTokenValidator(value);
  }

  equals(other: AccessToken): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
