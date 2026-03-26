-- AlterTable
ALTER TABLE "UserInvitation" ADD COLUMN     "reportsToId" INTEGER;

-- CreateIndex
CREATE INDEX "UserInvitation_tenantId_reportsToId_idx" ON "UserInvitation"("tenantId", "reportsToId");

-- AddForeignKey
ALTER TABLE "UserInvitation" ADD CONSTRAINT "UserInvitation_reportsToId_fkey" FOREIGN KEY ("reportsToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
