ALTER TABLE "programmes"
  ADD COLUMN "code" VARCHAR(50),
  ADD COLUMN "programme_type" VARCHAR(100),
  ADD COLUMN "target_audience" VARCHAR(500),
  ADD COLUMN "duration_weeks" INTEGER,
  ADD COLUMN "delivery_mode" VARCHAR(100),
  ADD COLUMN "cover_image_url" VARCHAR(500),
  ADD COLUMN "learning_objectives" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "eligibility" TEXT;

CREATE UNIQUE INDEX "programmes_code_key" ON "programmes"("code");

ALTER TABLE "programmes"
  ADD CONSTRAINT "programmes_duration_weeks_check" CHECK ("duration_weeks" IS NULL OR "duration_weeks" > 0);
