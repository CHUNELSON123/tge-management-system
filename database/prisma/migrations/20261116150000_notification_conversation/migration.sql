ALTER TABLE "notifications" ADD COLUMN "conversation_id" UUID;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "notifications_conversation_id_idx" ON "notifications"("conversation_id");
