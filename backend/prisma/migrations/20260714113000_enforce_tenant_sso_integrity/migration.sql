-- Enforce tenant-scoped SSO identities and cross-tenant relational integrity.

-- The earlier SSO migration created updatedAt with a database default. Prisma owns
-- this field through @updatedAt, so remove the default after the table exists.
ALTER TABLE "tenant_identity_providers"
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Provider tenant IDs participate in uniqueness, so keep nulls from bypassing the
-- unique key semantics in PostgreSQL.
UPDATE "external_identities"
SET "providerTenantId" = ''
WHERE "providerTenantId" IS NULL;

ALTER TABLE "external_identities"
ALTER COLUMN "providerTenantId" SET DEFAULT '',
ALTER COLUMN "providerTenantId" SET NOT NULL;

DROP INDEX IF EXISTS "external_identities_provider_subject_providerTenantId_key";
CREATE UNIQUE INDEX "external_identities_tenantId_provider_subject_providerTenantId_key"
ON "external_identities"("tenantId", "provider", "subject", "providerTenantId");

-- Composite foreign keys need matching unique keys on the referenced models.
CREATE UNIQUE INDEX IF NOT EXISTS "users_id_tenantId_key"
ON "users"("id", "tenantId");

CREATE UNIQUE INDEX IF NOT EXISTS "leaves_id_tenantId_key"
ON "leaves"("id", "tenantId");

-- Replace single-column foreign keys with tenant-aware composite foreign keys.
ALTER TABLE "external_identities" DROP CONSTRAINT IF EXISTS "external_identities_userId_fkey";
ALTER TABLE "external_identities"
ADD CONSTRAINT "external_identities_userId_tenantId_fkey"
FOREIGN KEY ("userId", "tenantId") REFERENCES "users"("id", "tenantId")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_reportsToId_fkey";
ALTER TABLE "users"
ADD CONSTRAINT "users_reportsToId_tenantId_fkey"
FOREIGN KEY ("reportsToId", "tenantId") REFERENCES "users"("id", "tenantId")
ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "leaves" DROP CONSTRAINT IF EXISTS "leaves_userId_fkey";
ALTER TABLE "leaves"
ADD CONSTRAINT "leaves_userId_tenantId_fkey"
FOREIGN KEY ("userId", "tenantId") REFERENCES "users"("id", "tenantId")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "leaves" DROP CONSTRAINT IF EXISTS "leaves_actionedBy_fkey";
ALTER TABLE "leaves"
ADD CONSTRAINT "leaves_actionedBy_tenantId_fkey"
FOREIGN KEY ("actionedBy", "tenantId") REFERENCES "users"("id", "tenantId")
ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "leaves" DROP CONSTRAINT IF EXISTS "leaves_approverId_fkey";
ALTER TABLE "leaves"
ADD CONSTRAINT "leaves_approverId_tenantId_fkey"
FOREIGN KEY ("approverId", "tenantId") REFERENCES "users"("id", "tenantId")
ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "UserInvitation" DROP CONSTRAINT IF EXISTS "UserInvitation_reportsToId_fkey";
ALTER TABLE "UserInvitation"
ADD CONSTRAINT "UserInvitation_reportsToId_tenantId_fkey"
FOREIGN KEY ("reportsToId", "tenantId") REFERENCES "users"("id", "tenantId")
ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_recipientId_fkey";
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_recipientId_tenantId_fkey"
FOREIGN KEY ("recipientId", "tenantId") REFERENCES "users"("id", "tenantId")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_triggeredById_fkey";
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_triggeredById_tenantId_fkey"
FOREIGN KEY ("triggeredById", "tenantId") REFERENCES "users"("id", "tenantId")
ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_leaveId_fkey";
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_leaveId_tenantId_fkey"
FOREIGN KEY ("leaveId", "tenantId") REFERENCES "leaves"("id", "tenantId")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "external_identities_tenantId_userId_idx"
ON "external_identities"("tenantId", "userId");

CREATE INDEX IF NOT EXISTS "users_tenantId_reportsToId_idx"
ON "users"("tenantId", "reportsToId");

CREATE INDEX IF NOT EXISTS "leaves_tenantId_userId_idx"
ON "leaves"("tenantId", "userId");

CREATE INDEX IF NOT EXISTS "leaves_tenantId_approverId_idx"
ON "leaves"("tenantId", "approverId");

CREATE INDEX IF NOT EXISTS "leaves_tenantId_actionedBy_idx"
ON "leaves"("tenantId", "actionedBy");

CREATE INDEX IF NOT EXISTS "notifications_tenantId_triggeredById_idx"
ON "notifications"("tenantId", "triggeredById");

CREATE INDEX IF NOT EXISTS "notifications_tenantId_leaveId_idx"
ON "notifications"("tenantId", "leaveId");

