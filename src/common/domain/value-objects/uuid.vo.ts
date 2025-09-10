import { IsNotEmpty, IsUUID, IsString } from 'class-validator';
import { BaseValueObject } from './base.vo';

class UuidValidator {
  @IsNotEmpty({ message: 'UUID deve ser uma string não vazia' })
  @IsString({ message: 'UUID deve ser uma string não vazia' })
  @IsUUID(4, { message: 'UUID deve ser um UUID v4 válido' })
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

/**
 * Value Object genérico para UUIDs v4
 * Pode ser usado para IDs de qualquer entidade
 */
export class Uuid extends BaseValueObject<string> {
  protected constructor(value: string) {
    super(value);
  }

  static create(value: string): Uuid {
    return new Uuid(value);
  }

  static generate(): Uuid {
    return new Uuid(crypto.randomUUID());
  }

  protected createValidator(value: string): object {
    return new UuidValidator(value);
  }

  equals(other: Uuid): boolean {
    return this.value === other.value;
  }
}
