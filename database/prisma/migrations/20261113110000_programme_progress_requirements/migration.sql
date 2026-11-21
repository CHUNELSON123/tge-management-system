CREATE TABLE "programme_progress_policies" (
  "id" UUID PRIMARY KEY,
  "programme_id" UUID NOT NULL UNIQUE REFERENCES "programmes"("id") ON DELETE CASCADE,
  "attendance_minimum" INTEGER CHECK ("attendance_minimum" BETWEEN 0 AND 100),
  "deliverables" JSONB NOT NULL DEFAULT '[]',
  "version" INTEGER NOT NULL DEFAULT 1,
  "updated_at" TIMESTAMPTZ(6) NOT NULL
);
CREATE TABLE "cohort_progress_policies" (
  "id" UUID PRIMARY KEY,
  "cohort_id" UUID NOT NULL UNIQUE REFERENCES "cohorts"("id") ON DELETE CASCADE,
  "attendance_minimum" INTEGER CHECK ("attendance_minimum" BETWEEN 0 AND 100),
  "deliverables" JSONB NOT NULL DEFAULT '[]',
  "version" INTEGER NOT NULL DEFAULT 1,
  "updated_at" TIMESTAMPTZ(6) NOT NULL
);
CREATE TABLE "enrollment_progress" (
  "id" UUID PRIMARY KEY,
  "enrollment_id" UUID NOT NULL UNIQUE REFERENCES "enrollments"("id") ON DELETE CASCADE,
  "attendance_attended" INTEGER CHECK ("attendance_attended" >= 0),
  "attendance_total" INTEGER CHECK ("attendance_total" >= 0),
  "completed_deliverables" JSONB NOT NULL DEFAULT '[]',
  "approved_policy_key" VARCHAR(100),
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CHECK (("attendance_attended" IS NULL AND "attendance_total" IS NULL) OR ("attendance_attended" IS NOT NULL AND "attendance_total" IS NOT NULL AND "attendance_attended" <= "attendance_total"))
);
