import { BaseValueObject } from '@/common';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

class ArticleContentValidator {
  @IsNotEmpty({ message: 'Conteúdo do artigo não pode estar vazio' })
  @IsString({ message: 'Conteúdo do artigo deve ser uma string' })
  @MinLength(50, {
    message: 'Conteúdo do artigo deve ter pelo menos 50 caracteres',
  })
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export class ArticleContent extends BaseValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): ArticleContent {
    return new ArticleContent(value);
  }

  protected createValidator(value: string): object {
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    return new ArticleContentValidator(trimmedValue);
  }

  getValue(): string {
    return this.value.trim();
  }

  equals(other: ArticleContent): boolean {
    return this.getValue() === other.getValue();
  }

  toString(): string {
    return this.getValue();
  }
}
