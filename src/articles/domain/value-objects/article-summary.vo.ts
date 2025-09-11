import { BaseValueObject } from '@/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ArticleContent } from './article-content.vo';

class ArticleSummaryValidator {
  @IsOptional()
  @IsString({ message: 'Resumo do artigo deve ser uma string' })
  @MaxLength(280, {
    message: 'Resumo do artigo não pode ter mais de 280 caracteres',
  })
  value?: string;

  constructor(value?: string) {
    this.value = value;
  }
}

export class ArticleSummary extends BaseValueObject<string | undefined> {
  private constructor(value?: string) {
    super(value);
  }

  static create(value?: string): ArticleSummary {
    return new ArticleSummary(value);
  }

  static createFromContent(content: ArticleContent): ArticleSummary {
    const contentValue = content.getValue();
    const summaryText = contentValue.slice(0, 280);
    return new ArticleSummary(summaryText);
  }

  protected createValidator(value?: string): object {
    const trimmedValue =
      value && typeof value === 'string' ? value.trim() : value;
    return new ArticleSummaryValidator(trimmedValue);
  }

  getValue(): string | undefined {
    return this.value && typeof this.value === 'string'
      ? this.value.trim()
      : this.value;
  }

  equals(other: ArticleSummary): boolean {
    return this.getValue() === other.getValue();
  }

  toString(): string {
    return this.getValue() || '';
  }
}
