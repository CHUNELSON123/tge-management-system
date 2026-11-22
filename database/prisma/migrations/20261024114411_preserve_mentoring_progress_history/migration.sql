-- DropForeignKey
ALTER TABLE "mentoring_progress_records" DROP CONSTRAINT "mentoring_progress_records_objective_id_fkey";

-- AddForeignKey
ALTER TABLE "mentoring_progress_records" ADD CONSTRAINT "mentoring_progress_records_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "mentoring_objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
