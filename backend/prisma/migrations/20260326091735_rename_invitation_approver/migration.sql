/*
  Warnings:

  - You are about to drop the column `reportsToId` on the `UserInvitation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserInvitation" DROP CONSTRAINT "UserInvitation_reportsToId_fkey";

-- DropIndex
DROP INDEX "public"."UserInvitation_tenantId_reportsToId_idx";

-- AlterTable
ALTER TABLE "UserInvitation" DROP COLUMN "reportsToId",
ADD COLUMN     "approverId" INTEGER;

-- CreateIndex
CREATE INDEX "UserInvitation_tenantId_approverId_idx" ON "UserInvitation"("tenantId", "approverId");

-- AddForeignKey
ALTER TABLE "UserInvitation" ADD CONSTRAINT "UserInvitation_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
