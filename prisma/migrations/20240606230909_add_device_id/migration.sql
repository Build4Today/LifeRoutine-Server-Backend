/*
  Warnings:

  - You are about to drop the column `createdAp` on the `habits` table. All the data in the column will be lost.
  - You are about to drop the column `dayId` on the `day_habits` table. All the data in the column will be lost.
  - You are about to drop the column `habitId` on the `day_habits` table. All the data in the column will be lost.
  - You are about to drop the column `habitId` on the `habit_week_days` table. All the data in the column will be lost.
  - You are about to drop the column `weekDay` on the `habit_week_days` table. All the data in the column will be lost.
  - Added the required column `created_ap` to the `habits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `day_id` to the `day_habits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `habit_id` to the `day_habits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `habit_id` to the `habit_week_days` table without a default value. This is not possible if the table is not empty.
  - Added the required column `week_day` to the `habit_week_days` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_habits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "created_ap" DATETIME NOT NULL,
    "deviceId" TEXT NOT NULL,
    CONSTRAINT "habits_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_habits" ("deviceId", "id", "title") SELECT "deviceId", "id", "title" FROM "habits";
DROP TABLE "habits";
ALTER TABLE "new_habits" RENAME TO "habits";
CREATE TABLE "new_day_habits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "day_id" TEXT NOT NULL,
    "habit_id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    CONSTRAINT "day_habits_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "days" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "day_habits_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_day_habits" ("deviceId", "id") SELECT "deviceId", "id" FROM "day_habits";
DROP TABLE "day_habits";
ALTER TABLE "new_day_habits" RENAME TO "day_habits";
CREATE UNIQUE INDEX "day_habits_day_id_habit_id_deviceId_key" ON "day_habits"("day_id", "habit_id", "deviceId");
CREATE TABLE "new_habit_week_days" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habit_id" TEXT NOT NULL,
    "week_day" INTEGER NOT NULL,
    CONSTRAINT "habit_week_days_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_habit_week_days" ("id") SELECT "id" FROM "habit_week_days";
DROP TABLE "habit_week_days";
ALTER TABLE "new_habit_week_days" RENAME TO "habit_week_days";
CREATE UNIQUE INDEX "habit_week_days_habit_id_week_day_key" ON "habit_week_days"("habit_id", "week_day");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
