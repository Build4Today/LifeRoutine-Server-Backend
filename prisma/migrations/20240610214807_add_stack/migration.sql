-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_habits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL,
    "device_id" TEXT NOT NULL,
    CONSTRAINT "habits_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_habits" ("created_at", "device_id", "id", "title") SELECT "created_at", "device_id", "id", "title" FROM "habits";
DROP TABLE "habits";
ALTER TABLE "new_habits" RENAME TO "habits";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
