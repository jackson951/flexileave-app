require("dotenv").config();
const express = require("express");
const router = express.Router();
const { getPrismaClient } = require("../utils/prismaClient");
const prisma = getPrismaClient();
const { authenticateToken, tenantGuard, authorizeRoles } = require("../middleware/auth");

const requireAdminOrManager = authorizeRoles("OWNER", "ADMIN", "MANAGER");

// Helper function to get tenant colors
const getTenantColors = async (tenantId) => {
  if (!tenantId) {
    return {
      primaryColor: "#4f46e5",
      secondaryColor: "#7c3aed"
    };
  }
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      primaryColor: true,
      secondaryColor: true
    }
  });
  
  return {
    primaryColor: tenant?.primaryColor || "#4f46e5",
    secondaryColor: tenant?.secondaryColor || "#7c3aed"
  };
};

// Helper function to format date for database queries
const formatDateForQuery = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper function to get leave type colors
const getLeaveTypeColor = (leaveType, index) => {
  const colors = {
    AnnualLeave: "#4f46e5",
    SickLeave: "#ef4444", 
    FamilyResponsibility: "#10b981",
    BereavementLeave: "#f59e0b",
    MaternityLeave: "#8b5cf6",
    PaternityLeave: "#06b6d4",
    UnpaidLeave: "#6b7280"
  };
  
  return colors[leaveType] || `hsl(${(index * 45) % 360}, 70%, 50%)`;
};

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and dashboard data API
 */

/**
 * @swagger
 * /api/analytics/leave-overview:
 *   get:
 *     summary: Get leave overview statistics for tenant
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Time period for analysis
 *     responses:
 *       200:
 *         description: Leave overview statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalLeaves:
 *                   type: integer
 *                 pendingCount:
 *                   type: integer
 *                 approvedCount:
 *                   type: integer
 *                 rejectedCount:
 *                   type: integer
 *                 cancelledCount:
 *                   type: integer
 *                 statusDistribution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       percentage:
 *                         type: number
 *                 leaveTypeDistribution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       leaveType:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       percentage:
 *                         type: number
 *                       color:
 *                         type: string
 *                 tenantColors:
 *                   type: object
 *                   properties:
 *                     primaryColor:
 *                       type: string
 *                     secondaryColor:
 *                       type: string
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
router.get("/leave-overview", authenticateToken, tenantGuard, async (req, res) => {
  try {
    const { period = "month" } = req.query;
    const tenantId = req.user.tenantId;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "quarter":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "month":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
    
    startDate = formatDateForQuery(startDate);
    
    // Get all leaves for the tenant in the specified period
    const leaves = await prisma.leave.findMany({
      where: {
        tenantId,
        submittedAt: {
          gte: startDate
        }
      },
      select: {
        status: true,
        leaveType: true,
        days: true,
        startDate: true,
        endDate: true
      }
    });
    
    // Calculate basic statistics
    const totalLeaves = leaves.length;
    const pendingCount = leaves.filter(l => l.status === "PENDING").length;
    const approvedCount = leaves.filter(l => l.status === "APPROVED").length;
    const rejectedCount = leaves.filter(l => l.status === "REJECTED").length;
    const cancelledCount = leaves.filter(l => l.status === "CANCELLED").length;
    
    // Status distribution
    const statusCounts = leaves.reduce((acc, leave) => {
      acc[leave.status] = (acc[leave.status] || 0) + 1;
      return acc;
    }, {});
    
    const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: totalLeaves > 0 ? Math.round((count / totalLeaves) * 100) : 0
    }));
    
    // Leave type distribution
    const leaveTypeCounts = leaves.reduce((acc, leave) => {
      acc[leave.leaveType] = (acc[leave.leaveType] || 0) + 1;
      return acc;
    }, {});
    
    const leaveTypeDistribution = Object.entries(leaveTypeCounts).map(([leaveType, count], index) => ({
      leaveType,
      count,
      percentage: totalLeaves > 0 ? Math.round((count / totalLeaves) * 100) : 0,
      color: getLeaveTypeColor(leaveType, index)
    }));
    
    // Get tenant colors
    const tenantColors = await getTenantColors(tenantId);
    
    res.json({
      totalLeaves,
      pendingCount,
      approvedCount,
      rejectedCount,
      cancelledCount,
      statusDistribution,
      leaveTypeDistribution,
      tenantColors
    });
  } catch (error) {
    console.error("Leave overview analytics error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/analytics/leave-trends:
 *   get:
 *     summary: Get leave trends over time
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Time period for trend analysis
 *       - in: interval
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *         description: Interval for grouping data
 *     responses:
 *       200:
 *         description: Leave trends data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       totalRequests:
 *                         type: integer
 *                       approvedRequests:
 *                         type: integer
 *                       pendingRequests:
 *                         type: integer
 *                 tenantColors:
 *                   type: object
 *                   properties:
 *                     primaryColor:
 *                       type: string
 *                     secondaryColor:
 *                       type: string
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
router.get("/leave-trends", authenticateToken, tenantGuard, async (req, res) => {
  try {
    const { period = "month", interval = "week" } = req.query;
    const tenantId = req.user.tenantId;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "quarter":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "month":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
    
    startDate = formatDateForQuery(startDate);
    
    // Get leaves data
    const leaves = await prisma.leave.findMany({
      where: {
        tenantId,
        submittedAt: {
          gte: startDate
        }
      },
      select: {
        submittedAt: true,
        status: true,
        startDate: true,
        endDate: true
      }
    });
    
    // Group data by interval
    const trends = [];
    const currentDate = new Date(startDate);
    const endDate = new Date(now);
    
    while (currentDate <= endDate) {
      const intervalEnd = new Date(currentDate);
      
      switch (interval) {
        case "week":
          intervalEnd.setDate(currentDate.getDate() + 6);
          break;
        case "month":
          intervalEnd.setMonth(currentDate.getMonth() + 1);
          intervalEnd.setDate(0);
          break;
        case "day":
        default:
          intervalEnd.setDate(currentDate.getDate());
          break;
      }
      
      const intervalData = leaves.filter(leave => {
        const leaveDate = new Date(leave.submittedAt);
        return leaveDate >= currentDate && leaveDate <= intervalEnd;
      });
      
      const totalRequests = intervalData.length;
      const approvedRequests = intervalData.filter(l => l.status === "APPROVED").length;
      const pendingRequests = intervalData.filter(l => l.status === "PENDING").length;
      
      trends.push({
        date: currentDate.toISOString().split('T')[0],
        totalRequests,
        approvedRequests,
        pendingRequests
      });
      
      // Move to next interval
      switch (interval) {
        case "week":
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case "month":
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case "day":
        default:
          currentDate.setDate(currentDate.getDate() + 1);
          break;
      }
    }
    
    const tenantColors = await getTenantColors(tenantId);
    
    res.json({
      trends,
      tenantColors
    });
  } catch (error) {
    console.error("Leave trends analytics error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/analytics/user-stats:
 *   get:
 *     summary: Get user/team statistics for managers and admins
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User and team statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pendingApprovals:
 *                   type: integer
 *                 subordinateStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       totalLeaves:
 *                         type: integer
 *                       pendingLeaves:
 *                         type: integer
 *                       approvedLeaves:
 *                         type: integer
 *                       rejectedLeaves:
 *                         type: integer
 *                 departmentStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       department:
 *                         type: string
 *                       totalLeaves:
 *                         type: integer
 *                       employeeCount:
 *                         type: integer
 *                       avgLeavesPerEmployee:
 *                         type: number
 *                 tenantColors:
 *                   type: object
 *                   properties:
 *                     primaryColor:
 *                       type: string
 *                     secondaryColor:
 *                       type: string
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
router.get("/user-stats", authenticateToken, tenantGuard, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    // Get pending approvals for current user (if they are a manager)
    let pendingApprovals = 0;
    if (userRole === "MANAGER" || userRole === "ADMIN" || userRole === "OWNER") {
      pendingApprovals = await prisma.leave.count({
        where: {
          tenantId,
          approverId: userId,
          status: "PENDING"
        }
      });
    }
    
    // Get subordinate statistics
    const subordinates = await prisma.user.findMany({
      where: {
        tenantId,
        reportsToId: userId
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true
      }
    });
    
    const subordinateStats = [];
    for (const subordinate of subordinates) {
      const leaves = await prisma.leave.findMany({
        where: {
          userId: subordinate.id
        },
        select: {
          status: true
        }
      });
      
      const totalLeaves = leaves.length;
      const pendingLeaves = leaves.filter(l => l.status === "PENDING").length;
      const approvedLeaves = leaves.filter(l => l.status === "APPROVED").length;
      const rejectedLeaves = leaves.filter(l => l.status === "REJECTED").length;
      
      subordinateStats.push({
        userId: subordinate.id,
        name: subordinate.name,
        email: subordinate.email,
        totalLeaves,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves
      });
    }
    
    // Get department statistics
    const departments = await prisma.user.groupBy({
      by: ['department'],
      where: {
        tenantId,
        department: { not: null }
      },
      _count: {
        id: true
      }
    });
    
    const departmentStats = [];
    for (const dept of departments) {
      const leaves = await prisma.leave.findMany({
        where: {
          tenantId,
          user: {
            department: dept.department
          }
        }
      });
      
      const totalLeaves = leaves.length;
      const employeeCount = dept._count.id;
      const avgLeavesPerEmployee = employeeCount > 0 ? totalLeaves / employeeCount : 0;
      
      departmentStats.push({
        department: dept.department,
        totalLeaves,
        employeeCount,
        avgLeavesPerEmployee: Math.round(avgLeavesPerEmployee * 100) / 100
      });
    }
    
    // Sort department stats by total leaves
    departmentStats.sort((a, b) => b.totalLeaves - a.totalLeaves);
    
    const tenantColors = await getTenantColors(tenantId);
    
    res.json({
      pendingApprovals,
      subordinateStats,
      departmentStats,
      tenantColors
    });
  } catch (error) {
    console.error("User stats analytics error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/analytics/notifications:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 *                 recentNotifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       message:
 *                         type: string
 *                       type:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       isRead:
 *                         type: boolean
 *                 tenantColors:
 *                   type: object
 *                   properties:
 *                     primaryColor:
 *                       type: string
 *                     secondaryColor:
 *                       type: string
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
router.get("/notifications", authenticateToken, tenantGuard, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    
    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        tenantId,
        recipientId: userId,
        isRead: false
      }
    });
    
    // Get recent notifications
    const recentNotifications = await prisma.notification.findMany({
      where: {
        tenantId,
        recipientId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    const tenantColors = await getTenantColors(tenantId);
    
    res.json({
      unreadCount,
      recentNotifications,
      tenantColors
    });
  } catch (error) {
    console.error("Notifications analytics error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/analytics/dashboard-summary:
 *   get:
 *     summary: Get complete dashboard summary for tenant
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Time period for analysis
 *     responses:
 *       200:
 *         description: Complete dashboard summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   $ref: '#/components/schemas/LeaveOverview'
 *                 trends:
 *                   $ref: '#/components/schemas/LeaveTrends'
 *                 userStats:
 *                   $ref: '#/components/schemas/UserStats'
 *                 notifications:
 *                   $ref: '#/components/schemas/NotificationStats'
 *       401:
 *         description: Access token required
 *       403:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
router.get("/dashboard-summary", authenticateToken, tenantGuard, async (req, res) => {
  try {
    const { period = "month" } = req.query;
    
    // Get all analytics data in parallel
    const [overview, trends, userStats, notifications] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_leaves,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
          SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
          SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count,
          SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_count
        FROM leaves 
        WHERE tenant_id = ${req.user.tenantId}
        AND submitted_at >= ${formatDateForQuery(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
      `,
      prisma.$queryRaw`
        SELECT 
          DATE(submitted_at) as date,
          COUNT(*) as total_requests,
          SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_requests,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_requests
        FROM leaves 
        WHERE tenant_id = ${req.user.tenantId}
        AND submitted_at >= ${formatDateForQuery(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
        GROUP BY DATE(submitted_at)
        ORDER BY date
      `,
      prisma.$queryRaw`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.department,
          COUNT(l.id) as total_leaves,
          SUM(CASE WHEN l.status = 'PENDING' THEN 1 ELSE 0 END) as pending_leaves,
          SUM(CASE WHEN l.status = 'APPROVED' THEN 1 ELSE 0 END) as approved_leaves,
          SUM(CASE WHEN l.status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_leaves
        FROM users u
        LEFT JOIN leaves l ON u.id = l.user_id
        WHERE u.tenant_id = ${req.user.tenantId}
        GROUP BY u.id, u.name, u.email, u.department
        ORDER BY total_leaves DESC
      `,
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as unread_count
        FROM notifications 
        WHERE tenant_id = ${req.user.tenantId}
        AND recipient_id = ${req.user.userId}
        AND is_read = false
      `
    ]);
    
    const tenantColors = await getTenantColors(req.user.tenantId);
    
    res.json({
      overview: {
        ...overview[0],
        tenantColors
      },
      trends: {
        data: trends,
        tenantColors
      },
      userStats: {
        data: userStats,
        tenantColors
      },
      notifications: {
        ...notifications[0],
        tenantColors
      }
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;