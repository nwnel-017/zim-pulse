/*
  Warnings:

  - You are about to drop the `survey_responses` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SurveyResponseMode" AS ENUM ('SINGLE_SELECT', 'MULTI_SELECT');

-- DropForeignKey
ALTER TABLE "survey_responses" DROP CONSTRAINT "survey_responses_cityId_fkey";

-- DropForeignKey
ALTER TABLE "survey_responses" DROP CONSTRAINT "survey_responses_languageId_fkey";

-- DropForeignKey
ALTER TABLE "survey_responses" DROP CONSTRAINT "survey_responses_questionId_fkey";

-- DropForeignKey
ALTER TABLE "survey_responses" DROP CONSTRAINT "survey_responses_userId_fkey";

-- AlterTable
ALTER TABLE "survey_questions" ADD COLUMN     "responseMode" "SurveyResponseMode" NOT NULL DEFAULT 'SINGLE_SELECT';

-- DropTable
DROP TABLE "survey_responses";

-- CreateTable
CREATE TABLE "survey_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_answers" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "textValue" TEXT,
    "numberValue" DOUBLE PRECISION,
    "booleanValue" BOOLEAN,
    "cityId" TEXT,
    "languageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "survey_submissions_userId_key" ON "survey_submissions"("userId");

-- CreateIndex
CREATE INDEX "survey_submissions_userId_idx" ON "survey_submissions"("userId");

-- CreateIndex
CREATE INDEX "survey_answers_submissionId_idx" ON "survey_answers"("submissionId");

-- CreateIndex
CREATE INDEX "survey_answers_questionId_idx" ON "survey_answers"("questionId");

-- CreateIndex
CREATE INDEX "survey_answers_cityId_idx" ON "survey_answers"("cityId");

-- CreateIndex
CREATE INDEX "survey_answers_languageId_idx" ON "survey_answers"("languageId");

-- AddForeignKey
ALTER TABLE "survey_submissions" ADD CONSTRAINT "survey_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "survey_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "city"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE CASCADE;
