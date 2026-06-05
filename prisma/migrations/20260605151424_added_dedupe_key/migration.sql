/*
  Warnings:

  - A unique constraint covering the columns `[dedupeKey]` on the table `city` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "city" ADD COLUMN     "dedupeKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "city_dedupeKey_key" ON "city"("dedupeKey");
