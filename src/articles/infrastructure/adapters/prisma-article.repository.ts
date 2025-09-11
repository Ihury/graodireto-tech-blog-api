import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ArticleRepositoryPort,
  PaginationOptions,
  ArticleListResult,
  ArticleFilters,
} from '../../domain/ports/article.repository.port';
import { Article } from '../../domain/entities/article.entity';
import { Uuid } from '@/common/domain/value-objects';
import {
  ArticleTitle,
  ArticleContent,
  ArticleSummary,
  ArticleSlug,
} from '../../domain/value-objects';

@Injectable()
export class PrismaArticleRepository implements ArticleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: Uuid): Promise<Article | null> {
    const articleData = await this.prisma.article.findUnique({
      where: { id: id.getValue(), is_deleted: false },
      include: {
        author: {
          select: {
            id: true,
            display_name: true,
            email: true,
          },
        },
        article_tags: {
          include: {
            tag: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return articleData ? this.toDomain(articleData) : null;
  }

  async findBySlug(slug: ArticleSlug): Promise<Article | null> {
    const articleData = await this.prisma.article.findUnique({
      where: {
        slug: slug.getValue(),
        is_deleted: false,
      },
      include: {
        author: {
          select: {
            id: true,
            display_name: true,
            email: true,
          },
        },
        article_tags: {
          include: {
            tag: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return articleData ? this.toDomain(articleData) : null;
  }

  async findMany(
    filters?: ArticleFilters,
    pagination?: PaginationOptions,
  ): Promise<ArticleListResult> {
    const where: any = {
      is_deleted: false,
    };

    if (filters?.slugSearch) {
      where.slug = {
        contains: filters.slugSearch,
        mode: 'insensitive',
      };
    }

    if (filters?.tagSlugs && filters.tagSlugs.length > 0) {
      where.article_tags = {
        some: {
          tag_slug: {
            in: filters.tagSlugs,
          },
        },
      };
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              display_name: true,
              email: true,
            },
          },
          article_tags: {
            include: {
              tag: {
                select: {
                  slug: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        take: pagination?.limit,
        skip: pagination?.offset,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      articles: articles.map((article) => this.toDomain(article)),
      total,
    };
  }

  async save(article: Article): Promise<Article> {
    const plainArticle = article.toPlainObject();
    const tagSlugs = article.getTags().map((tag) => tag.slug);

    const articleData = await this.prisma.article.upsert({
      where: { id: plainArticle.id },
      update: {
        title: plainArticle.title,
        slug: plainArticle.slug,
        summary: plainArticle.summary,
        content: plainArticle.content,
        cover_image_url: plainArticle.cover_image_url,
        updated_at: plainArticle.updated_at,
      },
      create: plainArticle,
      include: {
        author: {
          select: {
            id: true,
            display_name: true,
            email: true,
          },
        },
        article_tags: {
          include: {
            tag: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Sempre gerenciar associações de tags (mesmo se vazio)
    await this.updateArticleTags(articleData.id, tagSlugs);

    // Buscar o artigo novamente com as tags atualizadas
    const updatedArticleData = await this.prisma.article.findUnique({
      where: { id: articleData.id },
      include: {
        author: {
          select: {
            id: true,
            display_name: true,
            email: true,
          },
        },
        article_tags: {
          include: {
            tag: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return this.toDomain(updatedArticleData!);
  }

  private async updateArticleTags(
    articleId: string,
    tagSlugs: string[],
  ): Promise<void> {
    // Remover todas as associações existentes
    await this.prisma.articleTag.deleteMany({
      where: { article_id: articleId },
    });

    if (tagSlugs.length === 0) {
      return;
    }

    // Verificar quais tags existem e estão ativas
    const existingTags = await this.prisma.tag.findMany({
      where: {
        slug: { in: tagSlugs },
        active: true,
      },
      select: { slug: true },
    });

    if (existingTags.length > 0) {
      await this.prisma.articleTag.createMany({
        data: existingTags.map((tag) => ({
          article_id: articleId,
          tag_slug: tag.slug,
        })),
        skipDuplicates: true,
      });
    }
  }

  async delete(id: Uuid): Promise<void> {
    await this.prisma.article.update({
      where: { id: id.getValue() },
      data: { is_deleted: true, updated_at: new Date() },
    });
  }

  private toDomain(articleData: {
    id: string;
    author_id: string;
    title: string;
    slug: string;
    summary: string | null;
    content: string;
    cover_image_url: string | null;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
    article_tags?: Array<{
      tag: {
        slug: string;
        name: string;
      };
    }>;
  }): Article {
    const tags =
      articleData.article_tags?.map((articleTag) => ({
        slug: articleTag.tag.slug,
        name: articleTag.tag.name,
      })) || [];

    return Article.reconstitute({
      id: Uuid.create(articleData.id),
      authorId: Uuid.create(articleData.author_id),
      title: ArticleTitle.create(articleData.title),
      slug: ArticleSlug.create(articleData.slug),
      summary: articleData.summary
        ? ArticleSummary.create(articleData.summary)
        : undefined,
      content: ArticleContent.create(articleData.content),
      coverImageUrl: articleData.cover_image_url ?? undefined,
      isDeleted: articleData.is_deleted,
      createdAt: articleData.created_at,
      updatedAt: articleData.updated_at,
      tags,
    });
  }
}
