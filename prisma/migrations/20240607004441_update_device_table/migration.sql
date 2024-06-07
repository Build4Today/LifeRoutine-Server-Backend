/*
  Warnings:

  - Added the required column `created_at` to the `device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `device` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_device" ("id") SELECT "id" FROM "device";
DROP TABLE "device";
ALTER TABLE "new_device" RENAME TO "device";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
