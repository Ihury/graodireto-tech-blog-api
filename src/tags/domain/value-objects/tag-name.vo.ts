import { BaseValueObject } from '@/common';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

class TagNameValidator {
  @IsNotEmpty({ message: 'Nome da tag não pode estar vazio' })
  @IsString({ message: 'Nome da tag deve ser uma string' })
  @MinLength(2, { message: 'Nome da tag deve ter pelo menos 2 caracteres' })
  @MaxLength(60, { message: 'Nome da tag não pode ter mais de 60 caracteres' })
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export class TagName extends BaseValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): TagName {
    return new TagName(value);
  }

  protected createValidator(value: string): object {
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    return new TagNameValidator(trimmedValue);
  }

  getValue(): string {
    return this.value.trim();
  }

  equals(other: TagName): boolean {
    return this.getValue() === other.getValue();
  }

  toString(): string {
    return this.getValue();
  }
}
