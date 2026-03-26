-- AlterTable
ALTER TABLE "leaves" ADD COLUMN     "approverId" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reportsToId" INTEGER;

-- CreateIndex
CREATE INDEX "leaves_approverId_idx" ON "leaves"("approverId");

-- CreateIndex
CREATE INDEX "users_reportsToId_idx" ON "users"("reportsToId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_reportsToId_fkey" FOREIGN KEY ("reportsToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
