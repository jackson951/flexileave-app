/*
  SAFE MIGRATION (NO DATA LOSS)
*/

-- Add slug column (required for tenant-aware auth)
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "slug" TEXT;
UPDATE "tenants" SET "slug" = LOWER(REPLACE("name", ' ', '-')) WHERE "slug" IS NULL OR "slug" = '';
ALTER TABLE "tenants" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_key" ON "tenants"("slug");

-- Add isActive column and ensure existing rows default to true
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
UPDATE "tenants" SET "isActive" = true WHERE "isActive" IS NULL;
ALTER TABLE "tenants" ALTER COLUMN "isActive" SET NOT NULL;

-- Ensure default tenant exists
INSERT INTO "tenants" ("id", "name", "slug", "isActive", "createdAt")
VALUES (1, 'Default Tenant', 'default', true, NOW())
ON CONFLICT ("id") DO NOTHING;

-- Drop old indexes (will recreate after adjustments)
DROP INDEX IF EXISTS "public"."notifications_recipientId_createdAt_idx";
DROP INDEX IF EXISTS "public"."notifications_recipientId_isRead_idx";

-- =========================
-- FIX LEAVES
-- =========================
ALTER TABLE "leaves" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "leaves" SET "tenantId" = (
  SELECT "tenantId" FROM "users" WHERE "users"."id" = "leaves"."userId" LIMIT 1
)
WHERE "tenantId" IS NULL;
ALTER TABLE "leaves" ALTER COLUMN "tenantId" SET NOT NULL;

-- =========================
-- FIX NOTIFICATIONS
-- =========================
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "notifications" SET "tenantId" = (
  SELECT "tenantId" FROM "users" WHERE "users"."id" = "notifications"."recipientId" LIMIT 1
)
WHERE "tenantId" IS NULL;
ALTER TABLE "notifications" ALTER COLUMN "tenantId" SET NOT NULL;

-- =========================
-- USER INVITATION TABLE
-- =========================
CREATE TABLE IF NOT EXISTS "UserInvitation" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "tenantId" INTEGER NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "used" BOOLEAN DEFAULT false NOT NULL,
  "passwordHash" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =========================
-- INDEXES
-- =========================
CREATE INDEX IF NOT EXISTS "leaves_tenantId_idx" ON "leaves"("tenantId");
CREATE INDEX IF NOT EXISTS "leaves_userId_idx" ON "leaves"("userId");

CREATE INDEX IF NOT EXISTS "notifications_tenantId_recipientId_isRead_idx"
ON "notifications"("tenantId", "recipientId", "isRead");

CREATE INDEX IF NOT EXISTS "notifications_tenantId_createdAt_idx"
ON "notifications"("tenantId", "createdAt");

-- =========================
-- FOREIGN KEYS
-- =========================
ALTER TABLE "leaves"
ADD CONSTRAINT "leaves_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
