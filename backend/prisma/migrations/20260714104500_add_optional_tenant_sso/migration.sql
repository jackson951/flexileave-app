-- Optional tenant SSO architecture
CREATE TYPE "AuthMode" AS ENUM ('PASSWORD', 'SSO', 'PASSWORD_AND_SSO');
CREATE TYPE "SsoProvider" AS ENUM ('MICROSOFT_ENTRA_ID');

ALTER TABLE "tenants"
ADD COLUMN "authMode" "AuthMode" NOT NULL DEFAULT 'PASSWORD',
ADD COLUMN "allowedEmailDomains" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "tenant_identity_providers" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "provider" "SsoProvider" NOT NULL,
    "clientId" TEXT NOT NULL,
    "azureTenantId" TEXT,
    "issuer" TEXT,
    "jwksUri" TEXT,
    "authorizationUrl" TEXT,
    "tokenUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "autoProvisionUsers" BOOLEAN NOT NULL DEFAULT false,
    "defaultRole" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_identity_providers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "external_identities" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" "SsoProvider" NOT NULL,
    "providerTenantId" TEXT,
    "subject" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "external_identities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_identity_providers_tenantId_provider_key"
ON "tenant_identity_providers"("tenantId", "provider");

CREATE INDEX "tenant_identity_providers_provider_issuer_idx"
ON "tenant_identity_providers"("provider", "issuer");

CREATE UNIQUE INDEX "external_identities_provider_subject_providerTenantId_key"
ON "external_identities"("provider", "subject", "providerTenantId");

CREATE INDEX "external_identities_tenantId_email_idx"
ON "external_identities"("tenantId", "email");

CREATE INDEX "external_identities_userId_idx"
ON "external_identities"("userId");

ALTER TABLE "tenant_identity_providers"
ADD CONSTRAINT "tenant_identity_providers_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "external_identities"
ADD CONSTRAINT "external_identities_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "external_identities"
ADD CONSTRAINT "external_identities_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
