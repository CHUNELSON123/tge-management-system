CREATE TABLE "mentorship_quarterly_reports" (
  "id" UUID NOT NULL,
  "assignment_id" UUID NOT NULL,
  "year" INTEGER NOT NULL,
  "quarter" INTEGER NOT NULL,
  "summary" TEXT NOT NULL,
  "achievements" TEXT NOT NULL,
  "challenges" TEXT NOT NULL,
  "next_steps" TEXT NOT NULL,
  "authored_by_user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "mentorship_quarterly_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "mentorship_quarterly_reports_quarter_check" CHECK ("quarter" BETWEEN 1 AND 4),
  CONSTRAINT "mentorship_quarterly_reports_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "mentor_assignments"("id") ON DELETE RESTRICT,
  CONSTRAINT "mentorship_quarterly_reports_authored_by_user_id_fkey" FOREIGN KEY ("authored_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "mentorship_quarterly_reports_assignment_id_year_quarter_key" ON "mentorship_quarterly_reports"("assignment_id", "year", "quarter");
CREATE INDEX "mentorship_quarterly_reports_authored_by_user_id_idx" ON "mentorship_quarterly_reports"("authored_by_user_id");
