/*
  Warnings:

  - You are about to drop the column `created_ap` on the `habits` table. All the data in the column will be lost.
  - Added the required column `created_at` to the `habits` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_habits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL,
    "deviceId" TEXT NOT NULL,
    CONSTRAINT "habits_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_habits" ("deviceId", "id", "title") SELECT "deviceId", "id", "title" FROM "habits";
DROP TABLE "habits";
ALTER TABLE "new_habits" RENAME TO "habits";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
