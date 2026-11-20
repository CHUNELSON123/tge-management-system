CREATE TABLE "cohort_registration_fees" (
  "cohort_id" UUID PRIMARY KEY,
  "fee_id" UUID,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cohort_registration_fees_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE,
  CONSTRAINT "cohort_registration_fees_fee_id_fkey" FOREIGN KEY ("fee_id") REFERENCES "fee_definitions"("id") ON DELETE RESTRICT
);
CREATE TABLE "programme_registration_requests" (
  "id" UUID PRIMARY KEY,
  "member_id" UUID NOT NULL,
  "cohort_id" UUID NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
  "reason" TEXT,
  "reviewed_by_id" UUID,
  "reviewed_at" TIMESTAMPTZ(6),
  "charge_id" UUID UNIQUE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "programme_registration_requests_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT,
  CONSTRAINT "programme_registration_requests_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE RESTRICT,
  CONSTRAINT "programme_registration_requests_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "member_charges"("id") ON DELETE RESTRICT,
  CONSTRAINT "programme_registration_requests_member_id_cohort_id_key" UNIQUE ("member_id", "cohort_id")
);
CREATE INDEX "programme_registration_requests_cohort_id_status_created_at_idx" ON "programme_registration_requests"("cohort_id", "status", "created_at");
