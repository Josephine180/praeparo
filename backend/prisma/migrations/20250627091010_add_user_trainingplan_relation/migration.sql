-- CreateTable
CREATE TABLE "UserTrainingPlan" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "training_plan_id" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTrainingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTrainingPlan_user_id_training_plan_id_key" ON "UserTrainingPlan"("user_id", "training_plan_id");

-- AddForeignKey
ALTER TABLE "UserTrainingPlan" ADD CONSTRAINT "UserTrainingPlan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrainingPlan" ADD CONSTRAINT "UserTrainingPlan_training_plan_id_fkey" FOREIGN KEY ("training_plan_id") REFERENCES "TrainingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
