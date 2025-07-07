-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingPlan" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "goal_type" VARCHAR(100) NOT NULL,
    "goal_time" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Week" (
    "id" SERIAL NOT NULL,
    "training_plan_id" INTEGER NOT NULL,
    "week_number" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "Week_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "training_plan_id" INTEGER NOT NULL,
    "week_id" INTEGER NOT NULL,
    "session_number" INTEGER NOT NULL,
    "session_order" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "duree" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "nutrition_tip_id" INTEGER NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "energy_level" SMALLINT NOT NULL,
    "fatigue_level" SMALLINT NOT NULL,
    "motivation_level" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionTip" (
    "id" SERIAL NOT NULL,
    "week_number" INTEGER NOT NULL,
    "plan_type" VARCHAR(50) NOT NULL,
    "tip_text" TEXT NOT NULL,

    CONSTRAINT "NutritionTip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Week_training_plan_id_week_number_key" ON "Week"("training_plan_id", "week_number");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_session_id_key" ON "Feedback"("session_id");

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Week" ADD CONSTRAINT "Week_training_plan_id_fkey" FOREIGN KEY ("training_plan_id") REFERENCES "TrainingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_training_plan_id_fkey" FOREIGN KEY ("training_plan_id") REFERENCES "TrainingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_week_id_fkey" FOREIGN KEY ("week_id") REFERENCES "Week"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_nutrition_tip_id_fkey" FOREIGN KEY ("nutrition_tip_id") REFERENCES "NutritionTip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
