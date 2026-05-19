/*
  Warnings:

  - Added the required column `type` to the `survey_questions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SurveyQuestionType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DROPDOWN', 'RADIO', 'CHECKBOX', 'DATE', 'EMAIL');

-- DropIndex
DROP INDEX "survey_responses_userId_questionId_key";

-- AlterTable
ALTER TABLE "survey_questions" ADD COLUMN     "type" "SurveyQuestionType" NOT NULL;

-- CreateTable
CREATE TABLE "survey_question_combo_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_question_combo_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "survey_question_combo_options_questionId_idx" ON "survey_question_combo_options"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "survey_question_combo_options_questionId_value_key" ON "survey_question_combo_options"("questionId", "value");

-- AddForeignKey
ALTER TABLE "survey_question_combo_options" ADD CONSTRAINT "survey_question_combo_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
