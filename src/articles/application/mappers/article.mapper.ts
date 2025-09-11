import { Article, ArticleTag } from '../../domain/entities/article.entity';
import { UserResponse } from '@/auth';

export interface ArticleResponse {
  id: string;
  author: UserResponse;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  coverImageUrl?: string;
  tags: ArticleTag[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleListItemResponse {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  summary?: string;
  coverImageUrl?: string;
  tags: ArticleTag[];
  createdAt: Date;
  updatedAt: Date;
}

export class ArticleMapper {
  static toResponse(article: Article): ArticleResponse {
    const author = article.getAuthor();
    if (!author) {
      throw new Error('Author information is required for article response');
    }

    return {
      id: article.getId().getValue(),
      author: {
        id: author.id,
        email: author.email,
        displayName: author.displayName,
        avatarUrl: author.avatarUrl,
      },
      title: article.getTitle().getValue(),
      slug: article.getSlug().getValue(),
      summary: article.getSummary()?.getValue(),
      content: article.getContent().getValue(),
      coverImageUrl: article.getCoverImageUrl(),
      tags: article.getTags(),
      createdAt: article.getCreatedAt(),
      updatedAt: article.getUpdatedAt(),
    };
  }

  static toListItemResponse(article: Article): ArticleListItemResponse {
    return {
      id: article.getId().getValue(),
      authorId: article.getAuthorId().getValue(),
      title: article.getTitle().getValue(),
      slug: article.getSlug().getValue(),
      summary: article.getSummary()?.getValue(),
      coverImageUrl: article.getCoverImageUrl(),
      tags: article.getTags(),
      createdAt: article.getCreatedAt(),
      updatedAt: article.getUpdatedAt(),
    };
  }

  static toListResponse(articles: Article[]): ArticleListItemResponse[] {
    return articles.map((article) => this.toListItemResponse(article));
  }
}
