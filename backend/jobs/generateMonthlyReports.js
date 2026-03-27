const cron = require('node-cron');
const { getPrismaClient } = require('../utils/prismaClient');
const { sendEmail } = require('../utils/emailer');

const prisma = getPrismaClient();

/**
 * Job to generate and send monthly analytics reports to administrators
 * Runs on the 1st of every month at 8 AM
 */
const generateMonthlyReports = async () => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Only run if it's the 1st of the month
    if (now.getDate() !== 1) {
      return;
    }

    // Get all active tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true
      }
    });

    for (const tenant of tenants) {
      try {
        // Generate analytics data for the previous month
        const analyticsData = await generateTenantAnalytics(tenant.id, firstDayOfMonth, lastDayOfMonth);
        
        // Get administrators for this tenant
        const admins = await prisma.user.findMany({
          where: {
            tenantId: tenant.id,
            role: {
              in: ['SUPER_ADMIN', 'OWNER', 'ADMIN']
            },
            status: 'ACTIVE'
          }
        });

        // Send report to each administrator
        for (const admin of admins) {
          if (admin.email) {
            await sendMonthlyReportEmail(admin, tenant, analyticsData, now.getMonth(), now.getFullYear());
          }
        }

        console.log(`📊 Generated monthly report for tenant ${tenant.name} (${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()})`);
      } catch (error) {
        console.error(`Failed to generate report for tenant ${tenant.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to generate monthly reports:', error);
  }
};

/**
 * Generate analytics data for a specific tenant and time period
 */
const generateTenantAnalytics = async (tenantId, startDate, endDate) => {
  // Get leave statistics
  const leaveStats = await prisma.leave.groupBy({
    by: ['status'],
    where: {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      _all: true
    }
  });

  // Get leave type distribution
  const leaveTypeStats = await prisma.leave.groupBy({
    by: ['leaveType'],
    where: {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      _all: true
    }
  });

  // Get department statistics
  const departmentStats = await prisma.user.groupBy({
    by: ['department'],
    where: {
      tenantId,
      status: 'ACTIVE'
    },
    _count: {
      _all: true
    }
  });

  // Get pending approvals count
  const pendingApprovals = await prisma.leave.count({
    where: {
      tenantId,
      status: 'PENDING',
      approverId: {
        not: null
      }
    }
  });

  return {
    leaveStats,
    leaveTypeStats,
    departmentStats,
    pendingApprovals,
    period: {
      start: startDate,
      end: endDate
    }
  };
};

/**
 * Send monthly report email to administrator
 */
const sendMonthlyReportEmail = async (admin, tenant, analyticsData, month, year) => {
  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
  
  const leaveStatsHtml = analyticsData.leaveStats.map(stat => 
    `<li>${stat.status}: ${stat._count._all}</li>`
  ).join('');

  const leaveTypeHtml = analyticsData.leaveTypeStats.map(stat => 
    `<li>${stat.leaveType}: ${stat._count._all}</li>`
  ).join('');

  const departmentHtml = analyticsData.departmentStats.map(stat => 
    `<li>${stat.department || 'Unassigned'}: ${stat._count._all} employees</li>`
  ).join('');

  await sendEmail({
    to: admin.email,
    subject: `Monthly Analytics Report - ${monthName} ${year}`,
    html: `
      <h2>Monthly Analytics Report - ${tenant.name}</h2>
      <h3>Period: ${monthName} ${year}</h3>
      
      <h4>Leave Statistics</h4>
      <ul>${leaveStatsHtml}</ul>
      
      <h4>Leave Type Distribution</h4>
      <ul>${leaveTypeHtml}</ul>
      
      <h4>Department Statistics</h4>
      <ul>${departmentHtml}</ul>
      
      <h4>Pending Approvals</h4>
      <p>${analyticsData.pendingApprovals} pending leave requests</p>
      
      <p>Best regards,<br>${tenant.name} Team</p>
    `
  });
};

/**
 * Schedule the monthly report generation job
 * Runs on the 1st of every month at 8 AM
 */
const scheduleGenerateMonthlyReports = () => {
  // Schedule to run on the 1st of every month at 8 AM
  cron.schedule('0 8 1 * *', generateMonthlyReports, {
    scheduled: true,
    timezone: 'Africa/Johannesburg'
  });
  
  console.log('📅 Scheduled monthly analytics report job (1st of every month at 8 AM)');
};

module.exports = scheduleGenerateMonthlyReports;