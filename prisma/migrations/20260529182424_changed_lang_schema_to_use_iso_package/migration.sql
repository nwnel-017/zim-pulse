/*
  Warnings:

  - You are about to drop the column `iso6392` on the `language` table. All the data in the column will be lost.
  - You are about to drop the column `iso6392B` on the `language` table. All the data in the column will be lost.
  - You are about to drop the column `iso6392T` on the `language` table. All the data in the column will be lost.
  - You are about to drop the column `iso6393` on the `language` table. All the data in the column will be lost.
  - Made the column `iso6391` on table `language` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "language_iso6392B_key";

-- DropIndex
DROP INDEX "language_iso6392T_key";

-- DropIndex
DROP INDEX "language_iso6392_key";

-- DropIndex
DROP INDEX "language_iso6393_key";

-- AlterTable
ALTER TABLE "language" DROP COLUMN "iso6392",
DROP COLUMN "iso6392B",
DROP COLUMN "iso6392T",
DROP COLUMN "iso6393",
ALTER COLUMN "iso6391" SET NOT NULL;
