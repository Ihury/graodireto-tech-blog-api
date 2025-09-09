# TechBlog API — MVP

Plataforma interna para **compartilhamento de artigos técnicos** entre colaboradores/parceiros.
Este MVP cobre apenas o essencial:

* **Autenticação** por e-mail/senha.
* **Artigos** (título, resumo, conteúdo e **URL da imagem**).
* **Tags** (chips na UI) com relação **N:N** com artigos.
* **Comentários** com respostas.

**Modelagem (DBML):**
👉 [TechBlog-MVP no dbdiagram.io](https://dbdiagram.io/d/TechBlog-MVP-68c09f7161a46d388e460bd4)

---

## Tecnologias

* **Node.js**: **22.x** (LTS)
* **NestJS** (API HTTP)
* **Prisma ORM** (datasource: **PostgreSQL**)
* **TypeScript**
* Utilitários: `@nestjs/config`, `class-validator`, `class-transformer`, `supertest` (e2e)

---

## Como rodar (dev)

1. **Node 22.x** instalado.
2. **PostgreSQL** acessível.

```bash
# 1) Instalar dependências
npm install

# 2) Criar o arquivo .env (conforme .env.example) com a variável DATABASE_URL
# Depois edite as variáveis de ambiente

# 3) Prisma
npx prisma migrate dev --name init
npx prisma db seed # seeding

# 4) Subir a API
npm run start:dev
```

---

## Estrutura de dados (resumo)

* **users**: `email`, `password_hash`, `display_name`, `avatar_url`, `is_active`, timestamps
* **articles**: `author_id (FK)`, `title`, `summary`, `content`, `cover_image_url`, `is_deleted`, timestamps
* **tags**: `name`, `slug?`, `active`, timestamps
* **article\_tags**: (chave composta `article_id` + `tag_id`)
* **comments**: `article_id (FK)`, `author_id (FK)`, `parent_id? (self-FK)`, `content`, `is_deleted`, timestamps

> Ordenações típicas: `articles` por `(created_at DESC, id DESC)`, `comments` por `(article_id, created_at DESC, id DESC)` (o id é utilizado como critério de desempate na paginação por cursor).

---
