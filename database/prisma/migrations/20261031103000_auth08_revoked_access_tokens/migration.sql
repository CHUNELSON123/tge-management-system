CREATE TABLE "revoked_access_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revoked_access_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "revoked_access_tokens_token_id_key" ON "revoked_access_tokens"("token_id");
CREATE INDEX "revoked_access_tokens_expires_at_idx" ON "revoked_access_tokens"("expires_at");
CREATE INDEX "revoked_access_tokens_user_id_idx" ON "revoked_access_tokens"("user_id");

ALTER TABLE "revoked_access_tokens"
ADD CONSTRAINT "revoked_access_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
