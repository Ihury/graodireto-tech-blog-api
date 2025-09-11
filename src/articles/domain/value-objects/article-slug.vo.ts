import { BaseValueObject } from '@/common';
import { IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';
import { ArticleTitle } from './article-title.vo';
import { slugify } from '@/common/utils/slug.util';

class ArticleSlugValidator {
  @IsNotEmpty({ message: 'Slug do artigo não pode estar vazio' })
  @IsString({ message: 'Slug do artigo deve ser uma string' })
  @MaxLength(250, {
    message: 'Slug do artigo não pode ter mais de 250 caracteres',
  })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'Slug deve conter apenas letras minúsculas, números e hífens, sem espaços ou caracteres especiais',
  })
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export class ArticleSlug extends BaseValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(value: string): ArticleSlug {
    return new ArticleSlug(value);
  }

  static createFromTitle(title: ArticleTitle): ArticleSlug {
    const titleValue = title.getValue();
    const slugValue = slugify(titleValue);

    return new ArticleSlug(slugValue);
  }

  protected createValidator(value: string): object {
    return new ArticleSlugValidator(value);
  }

  equals(other: ArticleSlug): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
