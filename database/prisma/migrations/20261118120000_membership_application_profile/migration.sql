ALTER TABLE "membership_applications"
  ADD COLUMN "applicant_location" VARCHAR(255),
  ADD COLUMN "applicant_date_of_birth" DATE,
  ADD COLUMN "applicant_gender" VARCHAR(50),
  ADD COLUMN "applicant_nationality" VARCHAR(100),
  ADD COLUMN "applicant_preferred_language" VARCHAR(5),
  ADD COLUMN "applicant_timezone" VARCHAR(100),
  ADD COLUMN "applicant_bio" VARCHAR(250);
