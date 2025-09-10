-- CreateTable
CREATE TABLE "public"."user" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."article" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" VARCHAR(280),
    "content" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tag" (
    "id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."article_tag" (
    "article_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "article_tag_pkey" PRIMARY KEY ("article_id","tag_id")
);

-- CreateTable
CREATE TABLE "public"."comment" (
    "id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "parent_id" UUID,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE INDEX "idx_articles_published_at_id" ON "public"."article"("created_at", "id");

-- CreateIndex
CREATE INDEX "idx_articles_title" ON "public"."article"("title");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "public"."tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tag_slug_key" ON "public"."tag"("slug");

-- CreateIndex
CREATE INDEX "article_tag_tag_id_article_id_idx" ON "public"."article_tag"("tag_id", "article_id");

-- CreateIndex
CREATE INDEX "idx_comments_article_created_id" ON "public"."comment"("article_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "comment_parent_id_idx" ON "public"."comment"("parent_id");

-- AddForeignKey
ALTER TABLE "public"."article" ADD CONSTRAINT "article_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."article_tag" ADD CONSTRAINT "article_tag_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."article_tag" ADD CONSTRAINT "article_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comment" ADD CONSTRAINT "comment_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comment" ADD CONSTRAINT "comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comment" ADD CONSTRAINT "comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
