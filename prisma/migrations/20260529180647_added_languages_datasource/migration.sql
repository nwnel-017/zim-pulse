-- AlterEnum
ALTER TYPE "SurveyQuestionDataSource" ADD VALUE 'LANGUAGE';

-- AlterTable
ALTER TABLE "survey_responses" ADD COLUMN     "languageId" TEXT;

-- CreateTable
CREATE TABLE "language" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "localName" TEXT,
    "iso6391" TEXT,
    "iso6392" TEXT,
    "iso6392T" TEXT,
    "iso6392B" TEXT,
    "iso6393" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "language_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "language_iso6391_key" ON "language"("iso6391");

-- CreateIndex
CREATE UNIQUE INDEX "language_iso6392_key" ON "language"("iso6392");

-- CreateIndex
CREATE UNIQUE INDEX "language_iso6392T_key" ON "language"("iso6392T");

-- CreateIndex
CREATE UNIQUE INDEX "language_iso6392B_key" ON "language"("iso6392B");

-- CreateIndex
CREATE UNIQUE INDEX "language_iso6393_key" ON "language"("iso6393");

-- CreateIndex
CREATE INDEX "language_name_idx" ON "language"("name");

-- CreateIndex
CREATE INDEX "language_localName_idx" ON "language"("localName");

-- CreateIndex
CREATE INDEX "survey_responses_cityId_idx" ON "survey_responses"("cityId");

-- CreateIndex
CREATE INDEX "survey_responses_languageId_idx" ON "survey_responses"("languageId");

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE CASCADE;
