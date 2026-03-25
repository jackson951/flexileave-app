-- AlterTable
ALTER TABLE "UserInvitation" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "usedAt" TIMESTAMP(3);
