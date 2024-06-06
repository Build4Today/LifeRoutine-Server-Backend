/*
  Warnings:

  - You are about to drop the column `habit_id` on the `habit_week_days` table. All the data in the column will be lost.
  - You are about to drop the column `week_day` on the `habit_week_days` table. All the data in the column will be lost.
  - You are about to drop the column `day_id` on the `day_habits` table. All the data in the column will be lost.
  - You are about to drop the column `habit_id` on the `day_habits` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `habits` table. All the data in the column will be lost.
  - Added the required column `habitId` to the `habit_week_days` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weekDay` to the `habit_week_days` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceId` to the `days` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dayId` to the `day_habits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceId` to the `day_habits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `habitId` to the `day_habits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdAp` to the `habits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceId` to the `habits` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_habit_week_days" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habitId" TEXT NOT NULL,
    "weekDay" INTEGER NOT NULL,
    CONSTRAINT "habit_week_days_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_habit_week_days" ("id") SELECT "id" FROM "habit_week_days";
DROP TABLE "habit_week_days";
ALTER TABLE "new_habit_week_days" RENAME TO "habit_week_days";
CREATE UNIQUE INDEX "habit_week_days_habitId_weekDay_key" ON "habit_week_days"("habitId", "weekDay");
CREATE TABLE "new_days" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "deviceId" TEXT NOT NULL,
    CONSTRAINT "days_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_days" ("date", "id") SELECT "date", "id" FROM "days";
DROP TABLE "days";
ALTER TABLE "new_days" RENAME TO "days";
CREATE UNIQUE INDEX "days_date_deviceId_key" ON "days"("date", "deviceId");
CREATE TABLE "new_day_habits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    CONSTRAINT "day_habits_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "days" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "day_habits_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_day_habits" ("id") SELECT "id" FROM "day_habits";
DROP TABLE "day_habits";
ALTER TABLE "new_day_habits" RENAME TO "day_habits";
CREATE UNIQUE INDEX "day_habits_dayId_habitId_deviceId_key" ON "day_habits"("dayId", "habitId", "deviceId");
CREATE TABLE "new_habits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "createdAp" DATETIME NOT NULL,
    "deviceId" TEXT NOT NULL,
    CONSTRAINT "habits_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_habits" ("id", "title") SELECT "id", "title" FROM "habits";
DROP TABLE "habits";
ALTER TABLE "new_habits" RENAME TO "habits";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
