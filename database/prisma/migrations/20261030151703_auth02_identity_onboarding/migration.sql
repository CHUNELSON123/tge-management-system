/*
  Warnings:

  - The `status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "MembershipApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "mentoring_progress_records" DROP CONSTRAINT "mentoring_progress_records_objective_id_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "status",
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION';

-- CreateTable
CREATE TABLE "membership_applications" (
    "id" UUID NOT NULL,
    "applicant_first_name" VARCHAR(100) NOT NULL,
    "applicant_last_name" VARCHAR(100) NOT NULL,
    "applicant_email" VARCHAR(255) NOT NULL,
    "applicant_phone" VARCHAR(30),
    "status" "MembershipApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "membership_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_activation_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_activation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "membership_applications_applicant_email_idx" ON "membership_applications"("applicant_email");

-- CreateIndex
CREATE INDEX "membership_applications_status_idx" ON "membership_applications"("status");

-- CreateIndex
CREATE INDEX "membership_applications_user_id_idx" ON "membership_applications"("user_id");

-- CreateIndex
CREATE INDEX "membership_applications_reviewed_by_user_id_idx" ON "membership_applications"("reviewed_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_activation_tokens_token_hash_key" ON "account_activation_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "account_activation_tokens_user_id_idx" ON "account_activation_tokens"("user_id");

-- CreateIndex
CREATE INDEX "account_activation_tokens_expires_at_idx" ON "account_activation_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "mentoring_progress_records" ADD CONSTRAINT "mentoring_progress_records_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "mentoring_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_activation_tokens" ADD CONSTRAINT "account_activation_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rejected applications must have a non-empty rejection reason.
ALTER TABLE "membership_applications"
ADD CONSTRAINT "membership_applications_rejection_reason_required"
CHECK (
    "status" <> 'REJECTED'
    OR NULLIF(BTRIM("rejection_reason"), '') IS NOT NULL
);
