CREATE TABLE "website_entries" (
    "id" UUID NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "slug" VARCHAR(280) NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "created_by_user_id" UUID NOT NULL,
    "updated_by_user_id" UUID,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "website_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "website_entries_kind_check" CHECK ("kind" IN ('blog', 'testimonial', 'faq'))
);
CREATE UNIQUE INDEX "website_entries_kind_slug_key" ON "website_entries"("kind", "slug");
CREATE INDEX "website_entries_kind_status_published_at_idx" ON "website_entries"("kind", "status", "published_at");
ALTER TABLE "website_entries" ADD CONSTRAINT "website_entries_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "website_entries" ADD CONSTRAINT "website_entries_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "website_media" (
    "id" UUID NOT NULL,
    "title" VARCHAR(250) NOT NULL,
    "content_type" VARCHAR(50) NOT NULL,
    "data" BYTEA NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "created_by_user_id" UUID NOT NULL,
    "updated_by_user_id" UUID,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "website_media_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "website_media_status_published_at_idx" ON "website_media"("status", "published_at");
ALTER TABLE "website_media" ADD CONSTRAINT "website_media_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "website_media" ADD CONSTRAINT "website_media_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
