import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { slugify } from '../../src/common/utils/slug.util';
import { hashPassword } from '../../src/common/security/password.util';

// Domain imports
import { User } from '../../src/auth/domain/entities/user.entity';
import {
  Email,
  DisplayName,
  Uuid,
} from '../../src/common/domain/value-objects';
import { PasswordHash } from '../../src/auth/domain/value-objects/password-hash.vo';
import { Tag } from '../../src/tags/domain/entities/tag.entity';
import { TagName, TagSlug } from '../../src/tags/domain/value-objects';

// Use Case import
import { CreateArticleUseCase } from '../../src/articles/application/use-cases/create-article.use-case';
import { PrismaArticleRepository } from '../../src/articles/infrastructure/adapters/prisma-article.repository';
import { PrismaService } from '../../src/prisma/prisma.service';

const prisma = new PrismaClient();

// Configurar services para usar o CreateArticleUseCase
const prismaService = new PrismaService();
const articleRepository = new PrismaArticleRepository(prismaService);
const createArticleUseCase = new CreateArticleUseCase(articleRepository);

type ArticleSeed = {
  title: string;
  author: string;
  content: string;
  tag1?: string | null;
  tag2?: string | null;
  tag3?: string | null;
};

function getArticlesPath(): string {
  const preferred = path.resolve(
    process.cwd(),
    'prisma',
    'seed',
    'articles.json',
  );
  if (fs.existsSync(preferred)) return preferred;

  throw new Error(
    'articles.json não encontrado. Coloque em prisma/seed/articles.json e rode novamente.',
  );
}

function readArticles(jsonPath: string): ArticleSeed[] {
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const rows = JSON.parse(raw) as unknown;
  if (!Array.isArray(rows))
    throw new Error('O arquivo articles.json deve conter um array.');
  return rows as ArticleSeed[];
}

async function hashDefaultPassword(): Promise<string> {
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'techblog123';
  return hashPassword(defaultPassword);
}

async function ensureUser(
  displayName: string,
  cache: Map<string, string>,
): Promise<string> {
  const cached = cache.get(displayName);
  if (cached) return cached;

  const emailValue = `${slugify(displayName)}@graodireto.com.br`;

  // Verificar se usuário já existe
  const existingUser = await prisma.user.findUnique({
    where: { email: emailValue },
    select: { id: true },
  });

  if (existingUser) {
    cache.set(displayName, existingUser.id);
    return existingUser.id;
  }

  // Criar novo usuário usando entidade de domínio
  const email = Email.create(emailValue);
  const displayNameVO = DisplayName.create(displayName);
  const passwordHash = PasswordHash.create(await hashDefaultPassword());

  const userDomain = User.create({
    email,
    displayName: displayNameVO,
    passwordHash,
    isActive: true,
  });

  // Salvar no banco usando dados da entidade
  const plainUser = userDomain.toPlainObject();
  const savedUser = await prisma.user.create({
    data: plainUser,
    select: { id: true },
  });

  cache.set(displayName, savedUser.id);
  return savedUser.id;
}

async function ensureTags(
  tagNames: string[],
  cache: Map<string, string>,
): Promise<string[]> {
  const tagIds: string[] = [];
  for (const name of tagNames) {
    const clean = name.trim();
    if (!clean) continue;

    const slugValue = slugify(clean);
    const cached = cache.get(slugValue);
    if (cached) {
      tagIds.push(cached);
      continue;
    }

    // Verificar se tag já existe
    const existingTag = await prisma.tag.findUnique({
      where: { slug: slugValue },
      select: { slug: true },
    });

    if (existingTag) {
      cache.set(slugValue, existingTag.slug);
      tagIds.push(existingTag.slug);
      continue;
    }

    // Criar nova tag usando entidade de domínio
    const tagName = TagName.create(clean);
    const tagSlug = TagSlug.create(slugValue);

    const tagDomain = Tag.create({
      name: tagName,
      slug: tagSlug,
      active: true,
    });

    // Salvar no banco usando dados da entidade
    const plainTag = tagDomain.toPlainObject();
    const savedTag = await prisma.tag.create({
      data: plainTag,
      select: { slug: true },
    });

    cache.set(slugValue, savedTag.slug);
    tagIds.push(savedTag.slug);
  }
  return tagIds;
}

async function findExistingArticle(
  authorId: string,
  title: string,
): Promise<string | null> {
  const existing = await prisma.article.findFirst({
    where: { author_id: authorId, title },
    select: { id: true },
  });
  return existing?.id ?? null;
}

async function createArticleWithUseCase(
  authorId: string,
  title: string,
  content: string,
  tagSlugs: string[],
): Promise<void> {
  // Usar o CreateArticleUseCase para criar o artigo
  // Isso garante que todas as validações e regras de negócio sejam aplicadas
  await createArticleUseCase.execute({
    authorId,
    title,
    content,
    tags: tagSlugs,
  });
}

function extractTagNames(row: ArticleSeed): string[] {
  return [row.tag1, row.tag2, row.tag3].filter(Boolean).map((t) => String(t));
}

function validateRow(
  row: ArticleSeed,
): { title: string; author: string; content: string } | null {
  const title = row.title?.trim();
  const author = row.author?.trim();
  const content = row.content?.trim();
  if (!title || !author || !content) return null;
  return { title, author, content };
}

async function processArticleRow(
  row: ArticleSeed,
  userCache: Map<string, string>,
  tagCache: Map<string, string>,
): Promise<void> {
  const base = validateRow(row);
  if (!base) {
    console.warn(
      'Pulando registro inválido: precisa de title, author e content.',
    );
    return;
  }

  const authorId = await ensureUser(base.author, userCache);
  const tagSlugs = await ensureTags(extractTagNames(row), tagCache);

  const existsId = await findExistingArticle(authorId, base.title);
  if (existsId) {
    console.log(
      `Já existe: "${base.title}" de ${base.author}. Pulando criação.`,
    );
    return;
  }

  // Usar o CreateArticleUseCase que já gerencia tags automaticamente
  await createArticleWithUseCase(authorId, base.title, base.content, tagSlugs);
}

// ===== Main =====
async function main() {
  // Conectar o PrismaService
  await prismaService.$connect();

  const jsonPath = getArticlesPath();
  const rows = readArticles(jsonPath);

  const userCache = new Map<string, string>(); // display_name -> user.id
  const tagCache = new Map<string, string>(); // slug -> tag.slug

  for (const row of rows) {
    await processArticleRow(row, userCache, tagCache);
  }

  console.log('Seed concluído com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await prismaService.$disconnect();
  });
