import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  TagRepositoryPort,
  TagListResult,
} from '../../domain/ports/tag.repository.port';
import { Tag } from '../../domain/entities/tag.entity';
import { TagName, TagSlug } from '../../domain/value-objects';

@Injectable()
export class PrismaTagRepository implements TagRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(): Promise<TagListResult> {
    const [tagData, total] = await Promise.all([
      this.prisma.tag.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.tag.count({
        where: { active: true },
      }),
    ]);

    const tags = tagData.map((tag) => this.toDomain(tag));

    return {
      tags,
      total,
    };
  }

  private toDomain(tagData: {
    slug: string;
    name: string;
    active: boolean;
    created_at: Date;
  }): Tag {
    return Tag.reconstitute({
      slug: TagSlug.create(tagData.slug),
      name: TagName.create(tagData.name),
      active: tagData.active,
      createdAt: tagData.created_at,
    });
  }
}
