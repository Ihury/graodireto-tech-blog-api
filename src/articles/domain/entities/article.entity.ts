import { Uuid } from '@/common/domain/value-objects';
import {
  ArticleTitle,
  ArticleContent,
  ArticleSummary,
  ArticleSlug,
} from '../value-objects';

export interface ArticleTag {
  slug: string;
  name: string;
}

export interface ArticleProps {
  id: Uuid;
  authorId: Uuid;
  title: ArticleTitle;
  slug: ArticleSlug;
  summary?: ArticleSummary;
  content: ArticleContent;
  coverImageUrl?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags?: ArticleTag[];
}

export class Article {
  private constructor(private readonly props: ArticleProps) {}

  static create(
    props: Omit<
      ArticleProps,
      'id' | 'slug' | 'isDeleted' | 'createdAt' | 'updatedAt'
    > & {
      id?: Uuid;
      slug?: ArticleSlug;
    },
  ): Article {
    const now = new Date();

    // Se não foi fornecido um slug, gerar um baseado no título
    const slug = props.slug || ArticleSlug.createFromTitle(props.title);
    const summary =
      props.summary || ArticleSummary.createFromContent(props.content);

    return new Article({
      ...props,
      id: props.id || Uuid.create(crypto.randomUUID()),
      slug,
      summary,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ArticleProps): Article {
    return new Article(props);
  }

  // Getters
  getId(): Uuid {
    return this.props.id;
  }

  getAuthorId(): Uuid {
    return this.props.authorId;
  }

  getTitle(): ArticleTitle {
    return this.props.title;
  }

  getSlug(): ArticleSlug {
    return this.props.slug;
  }

  getSummary(): ArticleSummary | undefined {
    return this.props.summary;
  }

  getContent(): ArticleContent {
    return this.props.content;
  }

  getCoverImageUrl(): string | undefined {
    return this.props.coverImageUrl;
  }

  isArticleDeleted(): boolean {
    return this.props.isDeleted;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  getTags(): ArticleTag[] {
    return this.props.tags || [];
  }

  // Business methods
  updateTitle(newTitle: ArticleTitle): void {
    this.props.title = newTitle;
    this.updateTimestamp();
  }

  updateContent(newContent: ArticleContent): void {
    this.props.content = newContent;
    this.updateTimestamp();
  }

  updateSummary(newSummary?: ArticleSummary): void {
    this.props.summary = newSummary;
    this.updateTimestamp();
  }

  updateCoverImage(imageUrl?: string): void {
    this.props.coverImageUrl = imageUrl;
    this.updateTimestamp();
  }

  updateSlug(newSlug: ArticleSlug): void {
    this.props.slug = newSlug;
    this.updateTimestamp();
  }

  softDelete(): void {
    this.props.isDeleted = true;
    this.updateTimestamp();
  }

  restore(): void {
    this.props.isDeleted = false;
    this.updateTimestamp();
  }

  updateTags(tags: ArticleTag[]): void {
    this.props.tags = tags;
    this.updateTimestamp();
  }

  private updateTimestamp(): void {
    this.props.updatedAt = new Date();
  }

  toPlainObject() {
    return {
      id: this.props.id.getValue(),
      author_id: this.props.authorId.getValue(),
      title: this.props.title.getValue(),
      slug: this.props.slug.getValue(),
      summary: this.props.summary?.getValue(),
      content: this.props.content.getValue(),
      cover_image_url: this.props.coverImageUrl,
      is_deleted: this.props.isDeleted,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
    };
  }
}
