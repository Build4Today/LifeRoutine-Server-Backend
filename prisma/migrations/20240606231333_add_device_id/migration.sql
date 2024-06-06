/*
  Warnings:

  - You are about to drop the `Device` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Device";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "device" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_days" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "deviceId" TEXT NOT NULL,
    CONSTRAINT "days_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_days" ("date", "deviceId", "id") SELECT "date", "deviceId", "id" FROM "days";
DROP TABLE "days";
ALTER TABLE "new_days" RENAME TO "days";
CREATE UNIQUE INDEX "days_date_deviceId_key" ON "days"("date", "deviceId");
CREATE TABLE "new_habits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "created_ap" DATETIME NOT NULL,
    "deviceId" TEXT NOT NULL,
    CONSTRAINT "habits_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_habits" ("created_ap", "deviceId", "id", "title") SELECT "created_ap", "deviceId", "id", "title" FROM "habits";
DROP TABLE "habits";
ALTER TABLE "new_habits" RENAME TO "habits";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
