require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { getPrismaClient } = require("../utils/prismaClient");
const {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getSessionHintCookieOptions,
} = require("../utils/cookies");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { DEFAULT_LEAVE_BALANCES } = require("../constants/leaveBalances");
const {
  authenticateToken,
  tenantGuard,
  authorizeRoles,
} = require("../middleware/auth");
const {
  isEmailDomainAllowed,
  sanitizeIdentityProvider,
  verifySsoIdToken,
} = require("../utils/sso");

const prisma = getPrismaClient();
const router = express.Router();

const VALID_AUTH_MODES = ["PASSWORD", "SSO", "PASSWORD_AND_SSO"];
const VALID_SSO_PROVIDERS = ["MICROSOFT_ENTRA_ID"];
const TENANT_ADMIN_ROLES = ["OWNER", "ADMIN"];
const CONFIGURABLE_DEFAULT_ROLES = ["ADMIN", "MANAGER", "EMPLOYEE"];

const normalizeTenantSlug = (value) => value?.toString().trim().toLowerCase();
const normalizeProvider = (value) =>
  value?.toString().trim().toUpperCase() || "MICROSOFT_ENTRA_ID";

const normalizeDomains = (domains) => {
  if (!domains) return [];
  const list = Array.isArray(domains) ? domains : domains.toString().split(",");
  return [
    ...new Set(
      list
        .map((item) => item.toString().trim().toLowerCase().replace(/^@/, ""))
        .filter(Boolean)
    ),
  ];
};

const buildTokenPayload = (user, identity = {}) => ({
  id: user.id,
  userId: user.id,
  email: user.email,
  role: user.role,
  name: user.name,
  tenantId: user.tenantId,
  tenantSlug: user.tenant.slug,
  authProvider: identity.provider || "PASSWORD",
  externalSubject: identity.subject || undefined,
});

const issueSession = async (res, user, identity = {}) => {
  const accessToken = generateAccessToken(buildTokenPayload(user, identity));
  const refreshToken = generateRefreshToken(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());
  res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());
  res.cookie("auth_session", "1", getSessionHintCookieOptions());
};


/**
 * @swagger
 * tags:
 *   name: SSO
 *   description: Optional tenant-level single sign-on configuration and login
 */

/**
 * @swagger
 * /api/auth/sso/discovery:
 *   get:
 *     summary: Discover tenant authentication options
 *     tags: [SSO]
 *     parameters:
 *       - in: query
 *         name: tenantSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant slug used to load password/SSO options before login.
 *     responses:
 *       200:
 *         description: Tenant auth mode and enabled SSO providers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SsoDiscovery'
 *       400:
 *         description: tenantSlug is missing
 *       404:
 *         description: Tenant not found or inactive
 *       500:
 *         description: Failed to load SSO discovery
 */
router.get("/discovery", async (req, res) => {
  const tenantSlug = normalizeTenantSlug(req.query.tenantSlug);
  if (!tenantSlug) {
    return res.status(400).json({ message: "tenantSlug is required" });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        identityProviders: {
          where: { enabled: true },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!tenant || !tenant.isActive) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        authMode: tenant.authMode,
        passwordEnabled: tenant.authMode !== "SSO",
        ssoEnabled: tenant.authMode !== "PASSWORD",
        allowedEmailDomains: tenant.allowedEmailDomains,
      },
      providers: tenant.identityProviders.map(sanitizeIdentityProvider),
    });
  } catch (error) {
    console.error("SSO discovery error:", error);
    res.status(500).json({ message: "Failed to load SSO discovery" });
  }
});


/**
 * @swagger
 * /api/auth/sso/config:
 *   get:
 *     summary: Get current tenant SSO configuration
 *     tags: [SSO]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current tenant SSO configuration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SsoDiscovery'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Failed to load SSO configuration
 */
router.get(
  "/config",
  authenticateToken,
  tenantGuard,
  authorizeRoles(...TENANT_ADMIN_ROLES),
  async (req, res) => {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: req.user.tenantId },
        include: {
          identityProviders: {
            orderBy: { id: "asc" },
          },
        },
      });

      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      res.json({
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          authMode: tenant.authMode,
          allowedEmailDomains: tenant.allowedEmailDomains,
        },
        providers: tenant.identityProviders.map(sanitizeIdentityProvider),
      });
    } catch (error) {
      console.error("Get SSO config error:", error);
      res.status(500).json({ message: "Failed to load SSO configuration" });
    }
  }
);
/**
 * @swagger
 * /api/auth/sso/config:
 *   put:
 *     summary: Update tenant SSO configuration
 *     tags: [SSO]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               authMode:
 *                 type: string
 *                 enum: [PASSWORD, SSO, PASSWORD_AND_SSO]
 *                 default: PASSWORD_AND_SSO
 *               provider:
 *                 type: string
 *                 enum: [MICROSOFT_ENTRA_ID]
 *                 default: MICROSOFT_ENTRA_ID
 *               clientId:
 *                 type: string
 *                 description: Microsoft Entra ID application/client ID. Required unless authMode is PASSWORD.
 *               azureTenantId:
 *                 type: string
 *                 nullable: true
 *               issuer:
 *                 type: string
 *                 nullable: true
 *               jwksUri:
 *                 type: string
 *                 nullable: true
 *               authorizationUrl:
 *                 type: string
 *                 nullable: true
 *               tokenUrl:
 *                 type: string
 *                 nullable: true
 *               enabled:
 *                 type: boolean
 *                 default: true
 *               autoProvisionUsers:
 *                 type: boolean
 *                 default: false
 *               defaultRole:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, EMPLOYEE]
 *                 default: EMPLOYEE
 *               allowedEmailDomains:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [example.com]
 *     responses:
 *       200:
 *         description: SSO configuration updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 tenant:
 *                   $ref: '#/components/schemas/Tenant'
 *                 provider:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/TenantIdentityProvider'
 *                     - type: 'null'
 *       400:
 *         description: Invalid auth mode, provider, default role, or missing client ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Failed to update SSO configuration
 */
router.put(
  "/config",
  authenticateToken,
  tenantGuard,
  authorizeRoles(...TENANT_ADMIN_ROLES),
  async (req, res) => {
    const {
      authMode = "PASSWORD_AND_SSO",
      provider: providerInput = "MICROSOFT_ENTRA_ID",
      clientId,
      azureTenantId,
      issuer,
      jwksUri,
      authorizationUrl,
      tokenUrl,
      enabled = true,
      autoProvisionUsers = false,
      defaultRole = "EMPLOYEE",
      allowedEmailDomains,
    } = req.body;

    const normalizedAuthMode = authMode.toString().trim().toUpperCase();
    const provider = normalizeProvider(providerInput);

    if (!VALID_AUTH_MODES.includes(normalizedAuthMode)) {
      return res.status(400).json({
        message: `authMode must be one of ${VALID_AUTH_MODES.join(", ")}`,
      });
    }
    if (!VALID_SSO_PROVIDERS.includes(provider)) {
      return res.status(400).json({ message: "Unsupported SSO provider" });
    }
    if (!CONFIGURABLE_DEFAULT_ROLES.includes(defaultRole)) {
      return res.status(400).json({
        message: `defaultRole must be one of ${CONFIGURABLE_DEFAULT_ROLES.join(", ")}`,
      });
    }
    if (normalizedAuthMode !== "PASSWORD" && !clientId) {
      return res.status(400).json({ message: "clientId is required for SSO" });
    }

    const domains = normalizeDomains(allowedEmailDomains);

    try {
      const tenant = await prisma.tenant.update({
        where: { id: req.user.tenantId },
        data: {
          authMode: normalizedAuthMode,
          allowedEmailDomains: domains,
        },
      });

      let identityProvider = null;
      if (normalizedAuthMode !== "PASSWORD") {
        identityProvider = await prisma.tenantIdentityProvider.upsert({
          where: {
            tenantId_provider: {
              tenantId: tenant.id,
              provider,
            },
          },
          update: {
            clientId: clientId.trim(),
            azureTenantId: azureTenantId?.trim() || null,
            issuer: issuer?.trim() || null,
            jwksUri: jwksUri?.trim() || null,
            authorizationUrl: authorizationUrl?.trim() || null,
            tokenUrl: tokenUrl?.trim() || null,
            enabled: Boolean(enabled),
            autoProvisionUsers: Boolean(autoProvisionUsers),
            defaultRole,
          },
          create: {
            tenantId: tenant.id,
            provider,
            clientId: clientId.trim(),
            azureTenantId: azureTenantId?.trim() || null,
            issuer: issuer?.trim() || null,
            jwksUri: jwksUri?.trim() || null,
            authorizationUrl: authorizationUrl?.trim() || null,
            tokenUrl: tokenUrl?.trim() || null,
            enabled: Boolean(enabled),
            autoProvisionUsers: Boolean(autoProvisionUsers),
            defaultRole,
          },
        });
      }

      res.json({
        message: "SSO configuration updated",
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          authMode: tenant.authMode,
          allowedEmailDomains: tenant.allowedEmailDomains,
        },
        provider: identityProvider ? sanitizeIdentityProvider(identityProvider) : null,
      });
    } catch (error) {
      console.error("Update SSO config error:", error);
      res.status(500).json({ message: "Failed to update SSO configuration" });
    }
  }
);


/**
 * @swagger
 * /api/auth/sso/token-login:
 *   post:
 *     summary: Login with a tenant SSO ID token
 *     tags: [SSO]
 *     description: Validates a Microsoft Entra ID token against the tenant's configured identity provider, links or provisions the user, and issues the normal FlexiLeave auth cookies.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantSlug
 *               - idToken
 *             properties:
 *               tenantSlug:
 *                 type: string
 *                 example: flexileave
 *               provider:
 *                 type: string
 *                 enum: [MICROSOFT_ENTRA_ID]
 *                 default: MICROSOFT_ENTRA_ID
 *               idToken:
 *                 type: string
 *                 description: ID token returned by Microsoft Entra ID/MSAL.
 *     responses:
 *       200:
 *         description: SSO login successful
 *       400:
 *         description: Missing token, missing tenant slug, or invalid SSO token claims
 *       401:
 *         description: SSO login failed
 *       403:
 *         description: SSO disabled, domain not allowed, inactive user, or user not provisioned
 *       404:
 *         description: Tenant not found
 */
router.post("/token-login", async (req, res) => {
  const {
    tenantSlug: tenantSlugInput,
    provider: providerInput = "MICROSOFT_ENTRA_ID",
    idToken,
  } = req.body;

  const tenantSlug = normalizeTenantSlug(tenantSlugInput);
  const provider = normalizeProvider(providerInput);

  if (!tenantSlug || !idToken) {
    return res.status(400).json({ message: "tenantSlug and idToken are required" });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        identityProviders: {
          where: { provider, enabled: true },
          take: 1,
        },
      },
    });

    if (!tenant || !tenant.isActive) {
      return res.status(404).json({ message: "Tenant not found" });
    }
    if (tenant.authMode === "PASSWORD") {
      return res.status(403).json({ message: "SSO is not enabled for this tenant" });
    }

    const identityProvider = tenant.identityProviders[0];
    if (!identityProvider) {
      return res.status(400).json({ message: "No enabled SSO provider configured" });
    }

    const identity = await verifySsoIdToken({ idToken, identityProvider });
    if (!identity.subject) {
      return res.status(400).json({ message: "SSO token does not contain a stable subject" });
    }
    if (!isEmailDomainAllowed(identity.email, tenant.allowedEmailDomains)) {
      return res.status(403).json({ message: "Email domain is not allowed for this tenant" });
    }

    const existingIdentity = await prisma.externalIdentity.findUnique({
      where: {
        tenantId_provider_subject_providerTenantId: {
          tenantId: tenant.id,
          provider,
          subject: identity.subject,
          providerTenantId: identity.providerTenantId || "",
        },
      },
      include: {
        user: {
          include: {
            tenant: {
              select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true, secondaryColor: true },
            },
          },
        },
      },
    });

    let user = existingIdentity?.user || null;

    if (user && user.tenantId !== tenant.id) {
      return res.status(403).json({ message: "SSO identity belongs to another tenant" });
    }

    if (!user) {
      user = await prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: tenant.id,
            email: identity.email,
          },
        },
        include: {
          tenant: {
            select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true, secondaryColor: true },
          },
        },
      });

      if (!user) {
        if (!identityProvider.autoProvisionUsers) {
          return res.status(403).json({
            message: "User is not provisioned for this tenant. Ask an admin to invite the user or enable auto provisioning.",
          });
        }

        const generatedPasswordHash = await bcrypt.hash(
          crypto.randomBytes(32).toString("hex"),
          10
        );

        user = await prisma.user.create({
          data: {
            tenantId: tenant.id,
            name: identity.name,
            email: identity.email,
            password: generatedPasswordHash,
            joinDate: new Date(),
            leaveBalances: { ...DEFAULT_LEAVE_BALANCES },
            role: identityProvider.defaultRole,
            status: "ACTIVE",
          },
          include: {
            tenant: {
              select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true, secondaryColor: true },
            },
          },
        });
      }

      await prisma.externalIdentity.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          provider,
          providerTenantId: identity.providerTenantId || "",
          subject: identity.subject,
          email: identity.email,
          lastLoginAt: new Date(),
        },
      });
    } else {
      await prisma.externalIdentity.update({
        where: { id: existingIdentity.id },
        data: { lastLoginAt: new Date(), email: identity.email },
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "User account is inactive" });
    }

    await issueSession(res, user, identity);

    const { password, refreshToken, ...userData } = user;
    res.json({
      message: "SSO login successful",
      user: userData,
      identity: {
        provider,
        providerTenantId: identity.providerTenantId,
        email: identity.email,
      },
    });
  } catch (error) {
    console.error("SSO token login error:", error);
    res.status(401).json({ message: "SSO login failed", error: error.message });
  }
});

module.exports = router;

