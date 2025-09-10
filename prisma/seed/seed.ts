import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { slugify } from 'src/common/utils/slug.util';
import { hashPassword } from 'src/common/security/password.util';

const prisma = new PrismaClient();

type ArticleSeed = {
  title: string;
  author: string;
  content: string;
  tag1?: string | null;
  tag2?: string | null;
  tag3?: string | null;
};

function getArticlesPath(): string {
  const preferred = path.resolve(process.cwd(), 'prisma', 'seed', 'articles.json');
  if (fs.existsSync(preferred)) return preferred;

  throw new Error('articles.json não encontrado. Coloque em prisma/seed/articles.json e rode novamente.');
}

function readArticles(jsonPath: string): ArticleSeed[] {
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const rows = JSON.parse(raw) as unknown;
  if (!Array.isArray(rows)) throw new Error('O arquivo articles.json deve conter um array.');
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

  const email = `${slugify(displayName)}@graodireto.com.br`;
  const user = await prisma.user.upsert({
    where: { email },
    update: { display_name: displayName, is_active: true },
    create: {
      email,
      display_name: displayName,
      password_hash: await hashDefaultPassword(),
      is_active: true,
    },
    select: { id: true },
  });

  cache.set(displayName, user.id);
  return user.id;
}

async function ensureTags(tagNames: string[], cache: Map<string, string>): Promise<string[]> {
  const tagIds: string[] = [];
  for (const name of tagNames) {
    const clean = name.trim();
    if (!clean) continue;

    const slug = slugify(clean);
    const cached = cache.get(slug);
    if (cached) {
      tagIds.push(cached);
      continue;
    }

    const tag = await prisma.tag.upsert({
      where: { slug },
      update: { name: clean, active: true },
      create: { name: clean, slug, active: true },
      select: { id: true },
    });

    cache.set(slug, tag.id);
    tagIds.push(tag.id);
  }
  return tagIds;
}

async function findExistingArticle(authorId: string, title: string): Promise<string | null> {
  const existing = await prisma.article.findFirst({
    where: { author_id: authorId, title },
    select: { id: true },
  });
  return existing?.id ?? null;
}

async function createArticle(authorId: string, title: string, content: string): Promise<string> {
  const article = await prisma.article.create({
    data: { author_id: authorId, title, content },
    select: { id: true },
  });
  return article.id;
}

async function attachTags(articleId: string, tagIds: string[]): Promise<void> {
  if (!tagIds.length) return;
  await prisma.articleTag.createMany({
    data: tagIds.map((tag_id) => ({ article_id: articleId, tag_id })),
    skipDuplicates: true,
  });
}

function extractTagNames(row: ArticleSeed): string[] {
  return [row.tag1, row.tag2, row.tag3].filter(Boolean).map((t) => String(t)) as string[];
}

function validateRow(row: ArticleSeed): { title: string; author: string; content: string } | null {
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
    console.warn('Pulando registro inválido: precisa de title, author e content.');
    return;
  }

  const authorId = await ensureUser(base.author, userCache);
  const tagIds = await ensureTags(extractTagNames(row), tagCache);

  const existsId = await findExistingArticle(authorId, base.title);
  if (existsId) {
    console.log(`Já existe: "${base.title}" de ${base.author}. Pulando criação.`);
    return;
  }

  const articleId = await createArticle(authorId, base.title, base.content);
  await attachTags(articleId, tagIds);
}

// ===== Main =====
async function main() {
  const jsonPath = getArticlesPath();
  const rows = readArticles(jsonPath);

  const userCache = new Map<string, string>(); // display_name -> user.id
  const tagCache = new Map<string, string>();  // slug -> tag.id

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
  });