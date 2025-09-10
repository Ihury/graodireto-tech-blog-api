import { BaseValueObject } from '@/common';
import { IsNotEmpty, IsString } from 'class-validator';

class PasswordHashValidator {
  @IsNotEmpty({ message: 'PasswordHash deve ser uma string não vazia' })
  @IsString({ message: 'PasswordHash deve ser uma string não vazia' })
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export class PasswordHash extends BaseValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): PasswordHash {
    return new PasswordHash(value);
  }

  protected createValidator(value: string): object {
    return new PasswordHashValidator(value);
  }

  equals(other: PasswordHash): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
