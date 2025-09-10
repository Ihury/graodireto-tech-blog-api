import { IsNotEmpty, MinLength, MaxLength, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { BaseValueObject } from './base.vo';

class DisplayNameValidator {
  @IsNotEmpty({ message: 'DisplayName não pode estar vazio' })
  @IsString({ message: 'DisplayName deve ser uma string não vazia' })
  @MinLength(2, { message: 'DisplayName deve ter pelo menos 2 caracteres' })
  @MaxLength(100, {
    message: 'DisplayName não pode ter mais de 100 caracteres',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export class DisplayName extends BaseValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): DisplayName {
    return new DisplayName(value);
  }

  protected createValidator(value: string): object {
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    return new DisplayNameValidator(trimmedValue);
  }

  getValue(): string {
    return this.value.trim();
  }

  equals(other: DisplayName): boolean {
    return this.getValue() === other.getValue();
  }

  toString(): string {
    return this.getValue();
  }
}
