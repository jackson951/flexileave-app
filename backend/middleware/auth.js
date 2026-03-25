const jwt = require("jsonwebtoken");

const extractToken = (req) => {
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
};

const authenticateToken = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    req.user = {
      userId: decoded.userId ?? decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
      tenantId: decoded.tenantId,
      tenantSlug: decoded.tenantSlug,
    };
    next();
  });
};

const tenantGuard = (req, res, next) => {
  if (!req.user?.tenantId) {
    return res
      .status(403)
      .json({ message: "Tenant context is required for this endpoint" });
  }
  next();
};

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ message: "Role information is missing" });
  }
  const normalizedRole = req.user.role.toLowerCase();
  if (!allowedRoles.some((role) => role.toLowerCase() === normalizedRole)) {
    return res.status(403).json({
      message: "You do not have permission to perform this action",
    });
  }
  next();
};

module.exports = { authenticateToken, tenantGuard, authorizeRoles };
