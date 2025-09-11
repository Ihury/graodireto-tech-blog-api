import { BaseValueObject } from '@/common';
import { IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';

class TagSlugValidator {
  @IsNotEmpty({ message: 'Slug da tag não pode estar vazio' })
  @IsString({ message: 'Slug da tag deve ser uma string' })
  @MaxLength(80, { message: 'Slug da tag não pode ter mais de 80 caracteres' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export class TagSlug extends BaseValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): TagSlug {
    return new TagSlug(value);
  }

  protected createValidator(value: string): object {
    return new TagSlugValidator(value);
  }

  equals(other: TagSlug): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
