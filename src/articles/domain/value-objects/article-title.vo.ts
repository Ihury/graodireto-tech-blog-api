import { BaseValueObject } from '@/common';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

class ArticleTitleValidator {
  @IsNotEmpty({ message: 'Título do artigo não pode estar vazio' })
  @IsString({ message: 'Título do artigo deve ser uma string' })
  @MinLength(5, {
    message: 'Título do artigo deve ter pelo menos 5 caracteres',
  })
  @MaxLength(200, {
    message: 'Título do artigo não pode ter mais de 200 caracteres',
  })
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export class ArticleTitle extends BaseValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): ArticleTitle {
    return new ArticleTitle(value);
  }

  protected createValidator(value: string): object {
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    return new ArticleTitleValidator(trimmedValue);
  }

  getValue(): string {
    return this.value.trim();
  }

  equals(other: ArticleTitle): boolean {
    return this.getValue() === other.getValue();
  }

  toString(): string {
    return this.getValue();
  }
}
