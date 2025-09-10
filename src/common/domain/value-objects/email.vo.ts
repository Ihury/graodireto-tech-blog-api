import { IsEmail, MaxLength, IsNotEmpty } from 'class-validator';
import { BaseValueObject } from './base.vo';

class EmailValidator {
  @IsNotEmpty({ message: 'Email deve ser uma string não vazia' })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @MaxLength(320, { message: 'Email não pode ter mais de 320 caracteres' })
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export class Email extends BaseValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): Email {
    return new Email(value);
  }

  protected createValidator(value: string): object {
    return new EmailValidator(value);
  }

  equals(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
