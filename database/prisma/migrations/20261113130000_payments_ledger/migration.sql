CREATE TABLE "fee_definitions" (
  "id" UUID PRIMARY KEY, "name" VARCHAR(200) NOT NULL, "category" VARCHAR(30) NOT NULL CHECK ("category" IN ('membership','programme','event')), "audience" VARCHAR(20) NOT NULL CHECK ("audience" IN ('member','guest','all')),
  "amount_minor" INTEGER NOT NULL CHECK ("amount_minor" >= 0), "currency" CHAR(3) NOT NULL, "programme_id" UUID REFERENCES "programmes"("id") ON DELETE RESTRICT, "event_id" UUID REFERENCES "events"("id") ON DELETE RESTRICT,
  "active" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CHECK (("category" = 'programme' AND "programme_id" IS NOT NULL AND "event_id" IS NULL) OR ("category" = 'event' AND "event_id" IS NOT NULL AND "programme_id" IS NULL) OR ("category" = 'membership' AND "programme_id" IS NULL AND "event_id" IS NULL))
);
CREATE INDEX "fee_definitions_category_active_idx" ON "fee_definitions"("category", "active");
CREATE TABLE "member_charges" (
  "id" UUID PRIMARY KEY, "fee_id" UUID NOT NULL REFERENCES "fee_definitions"("id") ON DELETE RESTRICT, "member_id" UUID REFERENCES "members"("id") ON DELETE RESTRICT,
  "guest_name" VARCHAR(200), "guest_email" VARCHAR(255), "period_key" VARCHAR(100) NOT NULL, "fee_name" VARCHAR(200) NOT NULL, "amount_minor" INTEGER NOT NULL CHECK ("amount_minor" >= 0), "currency" CHAR(3) NOT NULL,
  "due_date" DATE, "created_by_user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (("member_id" IS NOT NULL AND "guest_name" IS NULL AND "guest_email" IS NULL) OR ("member_id" IS NULL AND "guest_name" IS NOT NULL AND "guest_email" IS NOT NULL)),
  UNIQUE ("fee_id", "member_id", "period_key"), UNIQUE ("fee_id", "guest_email", "period_key")
);
CREATE INDEX "member_charges_member_id_created_at_idx" ON "member_charges"("member_id", "created_at");
CREATE TABLE "payment_records" (
  "id" UUID PRIMARY KEY, "charge_id" UUID NOT NULL REFERENCES "member_charges"("id") ON DELETE RESTRICT,
  "kind" VARCHAR(20) NOT NULL CHECK ("kind" IN ('manual','simulation')), "status" VARCHAR(20) NOT NULL CHECK ("status" IN ('confirmed','success','pending','failed')),
  "amount_minor" INTEGER NOT NULL CHECK ("amount_minor" > 0), "currency" CHAR(3) NOT NULL, "method" VARCHAR(30) NOT NULL, "reference" VARCHAR(120) NOT NULL, "paid_at" TIMESTAMPTZ(6) NOT NULL,
  "recorded_by_user_id" UUID REFERENCES "users"("id") ON DELETE RESTRICT, "request_key" UUID UNIQUE, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (("kind" = 'manual' AND "status" = 'confirmed' AND "recorded_by_user_id" IS NOT NULL AND "request_key" IS NULL) OR ("kind" = 'simulation' AND "status" IN ('success','pending','failed') AND "recorded_by_user_id" IS NULL AND "request_key" IS NOT NULL))
);
CREATE INDEX "payment_records_charge_id_created_at_idx" ON "payment_records"("charge_id", "created_at");
CREATE UNIQUE INDEX "payment_records_manual_reference_unique" ON "payment_records" (lower("reference")) WHERE "kind" = 'manual';
INSERT INTO "permissions" ("id", "code", "description") VALUES (gen_random_uuid(), 'payments.manage', 'Manage fees, charges and manual payment records') ON CONFLICT ("code") DO NOTHING;
INSERT INTO "role_permissions" ("role_id", "permission_id") SELECT r."id", p."id" FROM "roles" r CROSS JOIN "permissions" p WHERE r."name" IN ('System Administrator','Organisation Administrator') AND p."code" = 'payments.manage' ON CONFLICT DO NOTHING;
