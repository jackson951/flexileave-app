require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
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

const prisma = new PrismaClient();
const router = express.Router();

const normalizeSlug = (value) => {
  if (!value) return null;
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

const DASHBOARD_ROLES = ["OWNER", "ADMIN", "MANAGER"];

/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Tenant lifecycle + analytics
 */

/**
 * @swagger
 * /api/tenants/register:
 *   post:
 *     summary: Register a new tenant and owner
 *     tags: [Tenants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantName
 *               - ownerName
 *               - ownerEmail
 *               - ownerPassword
 *             properties:
 *               tenantName:
 *                 type: string
 *               tenantSlug:
 *                 type: string
 *                 description: Optional custom slug
 *               ownerName:
 *                 type: string
 *               ownerEmail:
 *                 type: string
 *               ownerPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tenant registered successfully
 *       400:
 *         description: Missing required fields or slug invalid
 *       409:
 *         description: Tenant slug already exists
 *       500:
 *         description: Registration failed
 */
router.post("/register", async (req, res) => {
  const {
    tenantName,
    tenantSlug,
    ownerName,
    ownerEmail,
    ownerPassword,
  } = req.body;

  if (!tenantName || !ownerName || !ownerEmail || !ownerPassword) {
    return res.status(400).json({
      message:
        "tenantName, ownerName, ownerEmail, and ownerPassword are required.",
    });
  }

  const safeSlug =
    normalizeSlug(tenantSlug) || normalizeSlug(tenantName) || null;
  if (!safeSlug) {
    return res
      .status(400)
      .json({ message: "Unable to generate a valid tenant slug." });
  }

  const normalizedOwnerEmail = ownerEmail.toLowerCase().trim();

  try {
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: safeSlug },
    });
    if (existingTenant) {
      return res
        .status(409)
        .json({ message: "Tenant slug already exists. Choose another slug." });
    }

    const tenant = await prisma.tenant.create({
      data: { name: tenantName.trim(), slug: safeSlug },
    });

    const hashedPassword = await bcrypt.hash(ownerPassword, 10);

    const owner = await prisma.user.create({
      data: {
        name: ownerName.trim(),
        email: normalizedOwnerEmail,
        password: hashedPassword,
        tenantId: tenant.id,
        role: "OWNER",
        joinDate: new Date(),
        leaveBalances: { ...DEFAULT_LEAVE_BALANCES },
      },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const accessToken = generateAccessToken({
      id: owner.id,
      userId: owner.id,
      email: owner.email,
      role: owner.role,
      name: owner.name,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    });
    const refreshToken = generateRefreshToken(owner.id);

    await prisma.user.update({
      where: { id: owner.id },
      data: { refreshToken },
    });

    res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());
  res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());
  res.cookie("auth_session", "1", getSessionHintCookieOptions());

  res.status(201).json({
    message: "Tenant registered successfully",
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    user: {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      role: owner.role,
      tenantId: owner.tenantId,
    },
  });
} catch (error) {
  console.error("Tenant registration error:", error);
  res.status(500).json({ message: "Failed to register tenant" });
  }
});

/**
 * @swagger
 * /api/tenants/stats:
 *   get:
 *     summary: Tenant analytics dashboard
 *     tags: [Tenants]
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Tenant stats
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */

const parseDateParam = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildMonthRange = (date) => {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  const endInclusive = new Date(monthEnd.getTime() - 1);
  return {
    gte: monthStart,
    lte: endInclusive,
  };
};

const intersectDateRanges = (baseRange, overrideRange) => {
  const candidates = { gte: [], lte: [] };
  if (baseRange?.gte) candidates.gte.push(baseRange.gte.getTime());
  if (overrideRange?.gte) candidates.gte.push(overrideRange.gte.getTime());
  if (baseRange?.lte) candidates.lte.push(baseRange.lte.getTime());
  if (overrideRange?.lte) candidates.lte.push(overrideRange.lte.getTime());

  if (!candidates.gte.length && !candidates.lte.length) {
    return null;
  }

  const range = {};
  if (candidates.gte.length) {
    range.gte = new Date(Math.max(...candidates.gte));
  }
  if (candidates.lte.length) {
    range.lte = new Date(Math.min(...candidates.lte));
  }

  if (range.gte && range.lte && range.gte > range.lte) {
    return false;
  }

  return range;
};

router.get(
  "/stats",
  authenticateToken,
  tenantGuard,
  authorizeRoles(...DASHBOARD_ROLES),
  async (req, res) => {
    const { department, startDate, endDate } = req.query;
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ message: "Missing tenant context" });
    }

    const normalizedDepartment = department?.trim();
    const parsedStart = parseDateParam(startDate);
    const parsedEnd = parseDateParam(endDate);
    if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
      return res
        .status(400)
        .json({ message: "startDate must be before or equal to endDate" });
    }

    const tenantUserFilter = {
      tenantId,
      ...(normalizedDepartment ? { department: normalizedDepartment } : {}),
    };

    const baseDateRange = {};
    if (parsedStart) baseDateRange.gte = parsedStart;
    if (parsedEnd) {
      const inclusiveEnd = new Date(parsedEnd);
      inclusiveEnd.setHours(23, 59, 59, 999);
      baseDateRange.lte = inclusiveEnd;
    }

    const createLeaveWhere = ({ status, dateRange } = {}) => {
      const where = { user: tenantUserFilter };
      const combined = intersectDateRanges(
        Object.keys(baseDateRange).length ? baseDateRange : null,
        dateRange
      );
      if (combined === false) {
        return null;
      }
      if (combined) {
        where.submittedAt = combined;
      }
      if (status) {
        where.status = status;
      }
      return where;
    };

    try {
      const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalLeaves,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
      ] = await prisma.$transaction([
        prisma.user.count({ where: tenantUserFilter }),
        prisma.user.count({
          where: { ...tenantUserFilter, status: "ACTIVE" },
        }),
        prisma.user.count({
          where: { ...tenantUserFilter, status: "INACTIVE" },
        }),
        prisma.leave.count({ where: createLeaveWhere() }),
        prisma.leave.count({ where: createLeaveWhere({ status: "PENDING" }) }),
        prisma.leave.count({ where: createLeaveWhere({ status: "APPROVED" }) }),
        prisma.leave.count({ where: createLeaveWhere({ status: "REJECTED" }) }),
      ]);

      const today = new Date();
      const thisMonthRange = buildMonthRange(today);
      const lastMonthRange = buildMonthRange(
        new Date(today.getFullYear(), today.getMonth() - 1, 1)
      );

      const leavesThisMonthWhere = createLeaveWhere({ dateRange: thisMonthRange });
      const leavesLastMonthWhere = createLeaveWhere({ dateRange: lastMonthRange });

      const leavesThisMonth = leavesThisMonthWhere
        ? await prisma.leave.count({ where: leavesThisMonthWhere })
        : 0;
      const leavesLastMonth = leavesLastMonthWhere
        ? await prisma.leave.count({ where: leavesLastMonthWhere })
        : 0;

      const monthlySegments = [];
      for (let offset = 5; offset >= 0; offset -= 1) {
        const referenceDate = new Date(
          today.getFullYear(),
          today.getMonth() - offset,
          1
        );
        const segmentRange = buildMonthRange(referenceDate);
        const label = referenceDate.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        monthlySegments.push({ label, range: segmentRange });
      }

      const monthlyTrends = [];
      for (const segment of monthlySegments) {
        const segmentWhere = createLeaveWhere({ dateRange: segment.range });
        if (!segmentWhere) {
          monthlyTrends.push({
            label: segment.label,
            total: 0,
            breakdown: { pending: 0, approved: 0, rejected: 0 },
          });
          continue;
        }

        const grouped = await prisma.leave.groupBy({
          by: ["status"],
          where: segmentWhere,
          _count: { status: true },
        });

        const breakdown = {
          pending: 0,
          approved: 0,
          rejected: 0,
        };

        let totalForMonth = 0;
        grouped.forEach((item) => {
          const statusKey = item.status?.toLowerCase();
          const count = item._count.status;
          totalForMonth += count;
          if (statusKey && breakdown.hasOwnProperty(statusKey)) {
            breakdown[statusKey] = count;
          }
        });

        monthlyTrends.push({
          label: segment.label,
          total: totalForMonth,
          breakdown,
        });
      }

      const leaveTypeRows = await prisma.leave.groupBy({
        by: ["leaveType"],
        where: createLeaveWhere(),
        _count: { leaveType: true },
      });

      const leaveTypeBreakdown = leaveTypeRows.map((row) => ({
        leaveType: row.leaveType,
        count: row._count.leaveType,
      }));

      const departmentsRaw = await prisma.user.findMany({
        where: tenantUserFilter,
        select: { department: true },
        distinct: ["department"],
        orderBy: { department: "asc" },
      });
      const departments = [
        ...new Set(
          departmentsRaw
            .map((row) => row.department)
            .filter((dept) => Boolean(dept))
        ),
      ];

      const recentLeaves = await prisma.leave.findMany({
        where: createLeaveWhere(),
        orderBy: { submittedAt: "desc" },
        take: 6,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              department: true,
            },
          },
          actionedByUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const sanitizedRecent = recentLeaves.map((leave) => ({
        id: leave.id,
        leaveType: leave.leaveType,
        status: leave.status,
        submittedAt: leave.submittedAt,
        user: {
          id: leave.user?.id,
          name: leave.user?.name,
          department: leave.user?.department,
        },
        actionedBy: leave.actionedByUser
          ? {
              id: leave.actionedByUser.id,
              name: leave.actionedByUser.name,
            }
          : null,
      }));

      res.json({
        stats: {
          users: {
            total: totalUsers,
            active: activeUsers,
            inactive: inactiveUsers,
            departments,
          },
          leaves: {
            total: totalLeaves,
            pending: pendingLeaves,
            approved: approvedLeaves,
            rejected: rejectedLeaves,
            thisMonth: leavesThisMonth,
            lastMonth: leavesLastMonth,
            monthlyTrends,
            leaveTypeBreakdown,
            recentLeaves: sanitizedRecent,
          },
        },
      });
    } catch (error) {
      console.error("Tenant stats error:", error);
      res.status(500).json({
        message: "Failed to calculate tenant stats",
        error: error.message,
      });
    }
  }
);

module.exports = router;
