const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const JWKS_CACHE_MS = 10 * 60 * 1000;
const jwksCache = new Map();

const base64UrlJson = (value) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
};

const decodeJwt = (token) => {
  const [header, payload] = token.split(".");
  if (!header || !payload) {
    throw new Error("Invalid JWT format");
  }
  return {
    header: base64UrlJson(header),
    payload: base64UrlJson(payload),
  };
};

const fetchJson = async (url) => {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is required for SSO token validation");
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
};

const getMicrosoftMetadata = async (azureTenantId) => {
  if (!azureTenantId) return null;
  const safeTenantId = encodeURIComponent(azureTenantId);
  const metadataUrl = `https://login.microsoftonline.com/${safeTenantId}/v2.0/.well-known/openid-configuration`;
  return fetchJson(metadataUrl);
};

const getJwks = async (jwksUri) => {
  const cached = jwksCache.get(jwksUri);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.keys;
  }

  const jwks = await fetchJson(jwksUri);
  const keys = jwks.keys || [];
  jwksCache.set(jwksUri, {
    keys,
    expiresAt: Date.now() + JWKS_CACHE_MS,
  });
  return keys;
};

const resolveMicrosoftConfig = async (identityProvider) => {
  const metadata = identityProvider.azureTenantId
    ? await getMicrosoftMetadata(identityProvider.azureTenantId)
    : null;

  return {
    issuer:
      identityProvider.issuer ||
      metadata?.issuer ||
      (identityProvider.azureTenantId
        ? `https://login.microsoftonline.com/${identityProvider.azureTenantId}/v2.0`
        : null),
    jwksUri: identityProvider.jwksUri || metadata?.jwks_uri,
  };
};

const verifyMicrosoftEntraIdToken = async (idToken, identityProvider) => {
  const decoded = decodeJwt(idToken);
  if (decoded.header.alg !== "RS256") {
    throw new Error("Unsupported SSO token algorithm");
  }

  const config = await resolveMicrosoftConfig(identityProvider);
  if (!config.jwksUri) {
    throw new Error("SSO JWKS URI is not configured");
  }

  const keys = await getJwks(config.jwksUri);
  const jwk = keys.find((key) => key.kid === decoded.header.kid);
  if (!jwk) {
    throw new Error("Unable to find matching SSO signing key");
  }

  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const verifyOptions = {
    algorithms: ["RS256"],
    audience: identityProvider.clientId,
  };
  if (config.issuer) {
    verifyOptions.issuer = config.issuer;
  }

  const claims = jwt.verify(idToken, publicKey, verifyOptions);
  const email = (
    claims.preferred_username ||
    claims.email ||
    claims.upn ||
    ""
  )
    .toString()
    .toLowerCase()
    .trim();

  if (!email) {
    throw new Error("SSO token does not contain an email claim");
  }

  return {
    provider: "MICROSOFT_ENTRA_ID",
    providerTenantId: claims.tid || null,
    subject: claims.oid || claims.sub,
    email,
    name: claims.name || email,
    rawClaims: claims,
  };
};

const verifySsoIdToken = async ({ idToken, identityProvider }) => {
  if (identityProvider.provider !== "MICROSOFT_ENTRA_ID") {
    throw new Error(`Unsupported SSO provider: ${identityProvider.provider}`);
  }
  return verifyMicrosoftEntraIdToken(idToken, identityProvider);
};

const isEmailDomainAllowed = (email, allowedDomains = []) => {
  if (!allowedDomains.length) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  return allowedDomains
    .map((item) => item.toLowerCase().replace(/^@/, ""))
    .includes(domain);
};

const sanitizeIdentityProvider = (identityProvider) => ({
  id: identityProvider.id,
  provider: identityProvider.provider,
  clientId: identityProvider.clientId,
  azureTenantId: identityProvider.azureTenantId,
  issuer: identityProvider.issuer,
  authorizationUrl: identityProvider.authorizationUrl,
  tokenUrl: identityProvider.tokenUrl,
  enabled: identityProvider.enabled,
  autoProvisionUsers: identityProvider.autoProvisionUsers,
  defaultRole: identityProvider.defaultRole,
});

module.exports = {
  isEmailDomainAllowed,
  sanitizeIdentityProvider,
  verifySsoIdToken,
};
