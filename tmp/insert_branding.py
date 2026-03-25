from pathlib import Path
path = Path('backend/prisma/migrations/20260325161821_add_tenant_slug_and_invitations/migration.sql')
data = path.read_text()
needle = 'ALTER TABLE "tenants" ALTER COLUMN "isActive" SET NOT NULL;'
insert = needle + '\n\n-- Tenant branding colors\nALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;\nALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT;\nALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT;'
if needle not in data:
    raise SystemExit('needle missing')
if insert in data:
    raise SystemExit('already inserted')
data = data.replace(needle, insert, 1)
path.write_text(data)
