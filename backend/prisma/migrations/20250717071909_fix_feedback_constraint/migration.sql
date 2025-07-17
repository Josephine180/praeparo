/*
  Warnings:

  - A unique constraint covering the columns `[session_id,user_id]` on the table `Feedback` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Feedback_session_id_user_id_key" ON "Feedback"("session_id", "user_id");
