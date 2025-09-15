# TechBlog API — MVP

Plataforma interna para **compartilhamento de artigos técnicos** entre colaboradores/parceiros da empresa.

[![Status](https://img.shields.io/badge/status-MVP-green)]()
[![Stack](https://img.shields.io/badge/stack-Node%2022%20%2B%20NestJS-blue)]()
[![DB](https://img.shields.io/badge/db-PostgreSQL-336791)]()

---

## Sumário

* [Visão Geral](#visão-geral)
* [Escopo do MVP](#escopo-do-mvp)
* [Arquitetura & Decisões](#arquitetura--decisões)
* [Stack & Requisitos](#stack--requisitos)
* [Como Rodar Localmente](#como-rodar-localmente)
* [Configuração de Ambiente](#configuração-de-ambiente)
* [Banco de Dados](#banco-de-dados)
* [Carga Inicial (Seed)](#carga-inicial-seed)
* [Documentação da API](#documentação-da-api)
* [Convenções (Paginação/Ordenação/Filtro)](#convenções-paginaçãoordenaçãofiltro)
* [Testes & Qualidade](#testes--qualidade)
* [Segurança](#segurança)
* [Limitações do MVP](#limitações-do-mvp)
* [Roadmap](#roadmap)

---

## Visão Geral

* **Objetivo**: disponibilizar uma API para publicar e consumir artigos técnicos, com **comentários (e respostas)** e **tags**.
* **Autenticação**: **e-mail/senha** via JWT (não há **cadastro** de usuários no MVP; use usuários semeados).
* **Principais recursos**:

  * Artigos (criar, listar, detalhar, atualizar, excluir lógico)
  * Comentários com threading (respostas)
  * Tags (relação **N\:N** com artigos)
  * Busca por texto e por tags

---

## Escopo do MVP

* [x] **API REST** integrada a **PostgreSQL** (CRUD de artigos, comentários e tags)
* [x] **Busca** (texto e tags)
* [x] **Seed** com **JSON** de carga inicial (usuários e artigos)
* [x] **Sem cadastro de usuários** (login apenas com usuários do seed)
* [x] **Documentação** das decisões técnicas e organização do código

**Links úteis**

* Figma (protótipo): [Clique aqui](https://www.figma.com/design/MYt2al8AJCiS2YKgpWItlk/Hiring-Challenge-GD-%5BTechBlog%5D?node-id=2-2&t=ymT2UJW6EmZ0ujhc-1)
* Modelagem DBML: [dbdiagram.io](https://dbdiagram.io/d/TechBlog-MVP-68c09f7161a46d388e460bd4)
* JSON inicial: `./prisma/seed/articles.json`
* OpenAPI: `GET /api/docs` (UI) | `GET /api/docs/json` (JSON)

---

## Arquitetura & Decisões

### Visão de Alto Nível

```
Cliente
  |
  v
API REST (apresentação - NestJS)
  |
Camada de aplicação / domínio (use cases, entidades, VOs, ports)
  |
Repositórios (adapters) - Prisma ORM
  |
Banco Relacional (PostgreSQL)
```

### Padrões & Organização (Hexagonal / Ports & Adapters)

* **Estilo**: Arquitetura hexagonal (domínio independente de framework).
* **Módulos**: `articles/`, `comments/`, `tags/`, `auth/`.
* **Diretórios (ex. módulo articles)**

  * `domain/entities/` – entidades (`article.entity.ts`)
  * `domain/value-objects/` – VOs (`article-title.vo.ts`, `article-slug.vo.ts`)
  * `domain/ports/` – portas (`article.repository.port.ts`)
  * `application/use-cases/` – casos de uso (`create|list|get|update|delete-article.use-case.ts`)
  * `application/mappers/` – conversões domínio↔DTO (opcional)
  * `infrastructure/adapters/` – adapters **driven** (DB) — `prisma-article.repository.ts` implementa a porta
  * `presentation/dto/` – DTOs HTTP
  * `presentation/articles.controller.ts` – adapter **driver** (HTTP)
  * `articles.module.ts` – DI (binds das portas para adapters)
* **Regras**:

  * Nada de Nest/Prisma dentro de `domain/`.
  * DTOs só na borda HTTP; conversão no **use case**.
  * Consultas específicas: encapsular no adapter Prisma.

### Motivações-chave

1. **NestJS + Prisma + PostgreSQL**

   * **Por quê**: produtividade com TypeScript, DI e módulos do NestJS; Prisma fornece tipagem de ponta a ponta, migrações e DX; Postgres é robusto para relacionamentos **N\:N**.
   * **Alternativas**: Spring Boot + JPA.
   * **Trade-offs**: algum lock-in do Prisma; curva de aprendizado do Nest maior que Express.
     **Mitigações**: `prisma.$queryRaw` para casos especiais; migrações versionadas.

2. **Paginação por *cursor* para listas grandes (comentários)**

   * **Por quê**: melhor desempenho/estabilidade que `OFFSET` em tabelas extensas; fácil continuação (`?after=<cursor>`).
   * **Trade-offs**: cliente lida com `before/after` em vez de “página N”.
     **Mitigações**: expor `limit`, `sort`, `before/after`; ordenar por `created_at DESC, id DESC`; índice composto `(created_at, id)`.

3. **Exclusão lógica (soft delete) via `deleted_at`/`is_deleted`**

   * **Por quê**: preserva histórico/auditoria e relações sem órfãos; permite restauração.
   * **Uniqueness com soft delete**: usar **índice parcial** no Postgres para manter unicidade **apenas** quando ativo (ex.: título de artigo):

     ```sql
     CREATE UNIQUE INDEX uq_articles_title_active
       ON articles (lower(title))
       WHERE deleted_at IS NULL;
     ```

---

## Stack & Requisitos

* **Node.js**: **22.x** (LTS)
* **NestJS** (API HTTP) + **TypeScript**
* **Prisma ORM** (datasource: **PostgreSQL 17**)
* Utilitários: `@nestjs/config`, `class-validator`, `class-transformer`, `jest`, `supertest` (E2E)
* **Docker**/**Docker Compose** (opcional para banco)

---

## Como Rodar Localmente

```bash
# 1) Dependências
npm install

# 2) Banco de Dados
# opção A: Docker
docker compose up -d db
# opção B: Postgres local acessível

# 3) Variáveis de ambiente
cp .env.example .env
# edite DATABASE_URL, JWT_SECRET e demais variáveis

# 4) Prisma (migrações + seed) — DEV
npx prisma migrate dev --name init
npx prisma db seed

# 5) API em desenvolvimento
npm run start:dev

---

## Banco de Dados

### Modelagem

- **DBML**: 👉 [TechBlog MVP (dbdiagram.io)](https://dbdiagram.io/d/TechBlog-MVP-68c09f7161a46d388e460bd4)
- **Prisma**: `./prisma/schema.prisma` (modelagem construída com base no DBML)

### Migrações

* Caminho: `./prisma/migrations`
* Comandos:

  ```bash
  npx prisma migrate dev --name <nome>
  npx prisma migrate deploy
  ```

---

## Carga Inicial (Seed)

* Fonte: `./prisma/seed/articles.json` (inclui usuários e artigos)
* Execução:

  ```bash
  npx prisma db seed
  ```
* Estratégia:

  * `upsert` por `id` do JSON (quando aplicável)
  * Criação de **tags** únicas e vínculo N\:M `article_tags`
  * Usuários de seed servem para **login** (não há cadastro no MVP)

---

## Documentação da API

* **Swagger/OpenAPI**:

  * UI: `GET /api/docs`
  * JSON: `GET /api/docs/json`

---

## Convenções (Paginação/Ordenação/Filtro)

### Paginação por **Offset**

**Query:** `page` (>=1, padrão 1), `size` (1–50, padrão 10)
**Ex.:** `GET /articles?page=2&size=10&tags=nestjs,tech&search=prisma`

**Resposta:**

```json
{
  "data": [/* itens */],
  "meta": {
    "page": 1,
    "size": 10,
    "total": 42,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### Paginação por **Cursor**

**Query:** `size` (1–50, padrão 10), `after` (cursor base64 opcional)
**Ex.:**

* 1ª página: `GET /comments?articleId=...&size=10`
* Próxima: `GET /comments?articleId=...&size=10&after=<nextCursor>`

**Resposta:**

```json
{
  "data": [/* itens */],
  "meta": {
    "size": 10,
    "nextCursor": "eyJpZCI6IjQ1NiIsImNyZWF0ZWRBdCI6IjIwMjMtMTAtMTVUMDk6MDA6MDBaIn0="
  }
}
```

> `nextCursor` só aparece quando há próxima página.

### Ordenação & Filtros

* **Sort padrão**: `created_at DESC, id DESC`
* **Filtros comuns**: `tags=tag1,tag2`, `search=<texto>` (sobre `title/summary/content`), flags (`active`, `is_deleted = false`)

---

## Testes & Qualidade

* **Unitários**: use cases, entidades/VOs, controllers.
* **Integração**: adapters Prisma contra Postgres (Docker).
* **E2E**: controllers + `supertest` (opcional).
* **Linters/Formatters**: `eslint` + `prettier`.

```bash
npm test
npm run lint
```

---

## Segurança

* **Autenticação**: JWT (Bearer).
* **Autorização**: guards por rota.
* **CORS**: configurável via código (TODO: configuração do CORS via variável de ambiente).
* **SQL Injection**: mitigado por Prisma (parâmetros tipados) + validações (`class-validator`).
* **Soft delete**: sempre filtrar `is_deleted=false` nas consultas de leitura.

---

## Limitações do MVP

Transparência sobre o que **não** foi contemplado neste primeiro recorte. Abaixo, itens **fora do escopo**, impactos esperados e caminhos de evolução (mapeados ao *Roadmap*).

### Fora do escopo (por decisão)

* **Upload de imagens (cover)**

  * *Estado atual*: artigos aceitam **URL** de imagem apenas.
  * *Impacto*: sem armazenamento/otimização; links quebrados dependem do host externo.
  * *Evolução*: integração com storage (S3), var de ambiente para bucket, validação de MIME, URLs assinadas.

* **Curadoria/Moderação de conteúdo**

  * *Estado atual*: sem workflow de revisão/aprovação; sem flags de conteúdo sensível.
  * *Impacto*: risco de conteúdo inadequado em produção.
  * *Evolução*: status `draft/review/published`, workflow de aprovação.

* **RBAC avançado (papéis/permissões)**

  * *Estado atual*: autenticação via JWT; sem perfis como `admin/editor/reader`.
  * *Impacto*: controle de acesso simplificado; sem *scopes* granulares.
  * *Evolução*: modelo de `roles`/`permissions`, guards por recurso/ação.

* **Reações e favoritos**

  * *Estado atual*: sem “curtidas”, “claps” ou “favoritar”.
  * *Impacto*: menor engajamento; sem métricas de popularidade.
  * *Evolução*: contadores, endpoints de reação, ranking por engajamento.

* **Recomendações/Busca avançada**

  * *Estado atual*: busca simples por texto/tags no Postgres.
  * *Impacto*: relevância limitada; sem *similaridade* entre artigos.
  * *Evolução*: trigram (`pg_trgm` - similaridade) e/ou motor externo (OpenSearch/Elastic).

* **Versionamento e colaboração**

  * *Estado atual*: atualização sobrepõe conteúdo; sem histórico de versões.
  * *Impacto*: difícil auditar mudanças/rollback.
  * *Evolução*: tabela de *revisions* por artigo.

* **Segurança**

  * *Estado atual*: sem *rate limit* e *anti-abuse*.
  * *Impacto*: proteção limitada.
  * *Evolução*: *rate limiting* por IP/usuário.

* **Admin UI / Painel**

  * *Estado atual*: somente API; sem painel administrativo.
  * *Impacto*: operações de moderação/gestão exigem consultas direto no banco de dados.
  * *Evolução*: console web com autenticação, filtros e ações sobre usuários.

### Itens parcialmente cobertos

* **Paginação**

  * *Estado atual*: *offset* (listas gerais) e *cursor* (comentários).
  * *Limitação*: não há *seek pagination* por campos arbitrários além de `created_at, id`.
  * *Evolução*: expandir cursores para múltiplas ordenações e filtros.

* **Segurança**

  * *Estado atual*: JWT + validação; CORS configurável.
  * *Limitação*: ausência de *refresh token*, *token rotation*, *2FA*.
  * *Evolução*: fluxo com *refresh token*, rotação e revogação.

### O que **não** será entregue neste MVP

* Cadastro/gestão de usuários na aplicação (apenas **login com usuários do seed**).
* Import/export massivo de artigos via CSV/ZIP.

### Riscos conhecidos & mitigação

* **Links externos de imagem podem quebrar** → futura migração para storage próprio.
* **Busca simples pode não escalar em alto volume** → adicionar índices `GIN` e revisar *query plan*.
* **Controle de acesso insuficiente para produção** → priorizar RBAC no *Roadmap* antes de abrir para base ampla de usuários.

---

## Roadmap

* [ ] Cadastro/gestão de usuários e papéis
* [ ] Upload de imagens (cover) com storage
* [ ] Curtidas (artigos e comentários)
* [ ] Favoritos de artigos
* [ ] Recomendações (similaridade por tags/busca)
* [ ] Cache de leitura
* [ ] Observabilidade (metrics/tracing)
* [ ] CI/CD com checagem de testes e lint

---

> **Resumo do MVP**: **Node 22 + NestJS + Prisma (PostgreSQL 17)**, arquitetura **hexagonal**, **artigos/tags/comentários** com **soft delete**, **busca** por texto/tags, **paginações** por offset e cursor, **seed** inicial e **OpenAPI** exposta em `/api/docs`.
