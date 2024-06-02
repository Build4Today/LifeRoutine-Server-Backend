/*
  Warnings:

  - A unique constraint covering the columns `[date]` on the table `day` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "day_date_idx";

-- CreateIndex
CREATE UNIQUE INDEX "day_date_key" ON "day"("date");
