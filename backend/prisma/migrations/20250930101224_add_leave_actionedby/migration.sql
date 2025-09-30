-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_leaves" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "leaveType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "days" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rejectionReason" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "userId" INTEGER NOT NULL,
    "actionedBy" INTEGER,
    CONSTRAINT "leaves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "leaves_actionedBy_fkey" FOREIGN KEY ("actionedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_leaves" ("days", "emergencyContact", "emergencyPhone", "endDate", "id", "leaveType", "reason", "rejectionReason", "startDate", "status", "submittedAt", "userId") SELECT "days", "emergencyContact", "emergencyPhone", "endDate", "id", "leaveType", "reason", "rejectionReason", "startDate", "status", "submittedAt", "userId" FROM "leaves";
DROP TABLE "leaves";
ALTER TABLE "new_leaves" RENAME TO "leaves";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
