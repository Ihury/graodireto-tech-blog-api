import { BaseValueObject } from '@/common';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

class CommentContentValidator {
  @IsNotEmpty({ message: 'Conteúdo do comentário não pode estar vazio' })
  @IsString({ message: 'Conteúdo do comentário deve ser uma string' })
  @MinLength(1, {
    message: 'Conteúdo do comentário deve ter pelo menos 1 caractere',
  })
  @MaxLength(1000, {
    message: 'Conteúdo do comentário não pode ter mais de 1000 caracteres',
  })
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export class CommentContent extends BaseValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): CommentContent {
    return new CommentContent(value);
  }

  protected createValidator(value: string): object {
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    return new CommentContentValidator(trimmedValue);
  }

  getValue(): string {
    return this.value.trim();
  }

  equals(other: CommentContent): boolean {
    return this.getValue() === other.getValue();
  }

  toString(): string {
    return this.getValue();
  }
}
