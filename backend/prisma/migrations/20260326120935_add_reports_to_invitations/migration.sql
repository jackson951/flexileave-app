/*
  Warnings:

  - You are about to drop the column `approverId` on the `UserInvitation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserInvitation" DROP CONSTRAINT "UserInvitation_approverId_fkey";

-- DropIndex
DROP INDEX "public"."UserInvitation_tenantId_approverId_idx";

-- AlterTable
ALTER TABLE "UserInvitation" DROP COLUMN "approverId",
ADD COLUMN     "reportsToId" INTEGER;

-- CreateIndex
CREATE INDEX "UserInvitation_tenantId_reportsToId_idx" ON "UserInvitation"("tenantId", "reportsToId");

-- AddForeignKey
ALTER TABLE "UserInvitation" ADD CONSTRAINT "UserInvitation_reportsToId_fkey" FOREIGN KEY ("reportsToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
