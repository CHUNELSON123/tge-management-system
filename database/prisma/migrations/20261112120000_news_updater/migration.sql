ALTER TABLE "news" ADD COLUMN "updated_by_user_id" UUID;

CREATE INDEX "news_updated_by_user_id_idx" ON "news"("updated_by_user_id");

ALTER TABLE "news"
ADD CONSTRAINT "news_updated_by_user_id_fkey"
FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
