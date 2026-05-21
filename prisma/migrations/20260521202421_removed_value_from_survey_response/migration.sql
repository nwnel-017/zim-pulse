/*
  Warnings:

  - You are about to drop the column `value` on the `survey_question_combo_options` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[questionId]` on the table `survey_question_combo_options` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "survey_question_combo_options_questionId_value_key";

-- AlterTable
ALTER TABLE "survey_question_combo_options" DROP COLUMN "value";

-- CreateIndex
CREATE UNIQUE INDEX "survey_question_combo_options_questionId_key" ON "survey_question_combo_options"("questionId");
