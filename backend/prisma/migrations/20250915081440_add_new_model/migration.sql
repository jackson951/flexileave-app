-- AlterTable
ALTER TABLE "Leave" ADD COLUMN "emergencyContact" TEXT;
ALTER TABLE "Leave" ADD COLUMN "emergencyPhone" TEXT;

-- CreateTable
CREATE TABLE "File" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaveId" INTEGER NOT NULL,
    CONSTRAINT "File_leaveId_fkey" FOREIGN KEY ("leaveId") REFERENCES "Leave" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
