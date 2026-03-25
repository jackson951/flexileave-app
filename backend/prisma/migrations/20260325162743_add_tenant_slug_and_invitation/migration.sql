/*
  Warnings:

  - You are about to drop the column `usedAt` on the `UserInvitation` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."UserInvitation_tenantId_idx";

-- AlterTable
ALTER TABLE "UserInvitation" DROP COLUMN "usedAt";

-- CreateIndex
CREATE INDEX "UserInvitation_tenantId_email_idx" ON "UserInvitation"("tenantId", "email");
