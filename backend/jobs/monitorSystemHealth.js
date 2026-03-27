const cron = require('node-cron');
const { getPrismaClient } = require('../utils/prismaClient');
const os = require('os');

const prisma = getPrismaClient();

/**
 * Job to monitor system health and performance metrics
 * Runs every 15 minutes
 */
const monitorSystemHealth = async () => {
  try {
    const now = new Date();
    
    // Get system metrics
    const systemMetrics = {
      timestamp: now,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
      },
      cpu: {
        loadAverage: os.loadavg(),
        cores: os.cpus().length
      },
      uptime: os.uptime()
    };

    // Check database connectivity
    const dbHealth = await checkDatabaseHealth();
    
    // Check for any critical issues
    const issues = await checkForIssues();

    // Log system health
    console.log(`🏥 System Health Check - ${now.toISOString()}`);
    console.log(`Memory Usage: ${systemMetrics.memory.usage}% (${Math.round(systemMetrics.memory.used / 1024 / 1024)}MB / ${Math.round(systemMetrics.memory.total / 1024 / 1024)}MB)`);
    console.log(`Database: ${dbHealth.status} (${dbHealth.responseTime}ms)`);
    console.log(`Issues: ${issues.length} found`);

    // Send alerts for critical issues
    if (systemMetrics.memory.usage > 90) {
      console.warn(`⚠️ High memory usage detected: ${systemMetrics.memory.usage}%`);
      await createSystemAlert('HIGH_MEMORY_USAGE', `Memory usage is at ${systemMetrics.memory.usage}%`, systemMetrics);
    }

    if (!dbHealth.status) {
      console.error(`❌ Database connectivity issue detected`);
      await createSystemAlert('DATABASE_ERROR', 'Database connectivity issue detected', dbHealth);
    }

    if (issues.length > 0) {
      console.warn(`⚠️ ${issues.length} system issues detected`);
      for (const issue of issues) {
        await createSystemAlert(issue.type, issue.message, issue.data);
      }
    }

  } catch (error) {
    console.error('Failed to monitor system health:', error);
  }
};

/**
 * Check database health and response time
 */
const checkDatabaseHealth = async () => {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    return {
      status: true,
      responseTime,
      message: 'Database is healthy'
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: false,
      responseTime,
      message: 'Database connection failed',
      error: error.message
    };
  }
};

/**
 * Check for various system issues
 */
const checkForIssues = async () => {
  const issues = [];

  try {
    // Check for pending leaves that haven't been processed for too long
    const pendingLeaves = await prisma.leave.count({
      where: {
        status: 'PENDING',
        submittedAt: {
          lt: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) // Older than 7 days
        }
      }
    });

    if (pendingLeaves > 0) {
      issues.push({
        type: 'PENDING_LEAVES',
        message: `${pendingLeaves} leave requests have been pending for more than 7 days`,
        data: { pendingCount: pendingLeaves }
      });
    }

    // Check for expired invitations that haven't been cleaned up
    // Note: UserInvitation model doesn't have a status field, so we can't track this
    // This check is not applicable with the current schema
    // console.log('ℹ️ Expired invitations check skipped - UserInvitation model has no status field');

    // Check for users with negative leave balances
    const negativeBalances = await prisma.user.count({
      where: {
        leaveBalances: {
          path: ['annual'],
          lt: 0
        }
      }
    });

    if (negativeBalances > 0) {
      issues.push({
        type: 'NEGATIVE_BALANCES',
        message: `${negativeBalances} users have negative leave balances`,
        data: { negativeBalanceCount: negativeBalances }
      });
    }

  } catch (error) {
    issues.push({
      type: 'HEALTH_CHECK_ERROR',
      message: 'Failed to check for system issues',
      data: { error: error.message }
    });
  }

  return issues;
};

/**
 * Create a system alert notification
 */
const createSystemAlert = async (type, message, data) => {
  try {
    // Get system administrators
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ['SUPER_ADMIN', 'OWNER', 'ADMIN']
        },
        status: 'ACTIVE'
      }
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          tenantId: admin.tenantId,
          type: 'system',
          title: `System Alert: ${type}`,
          message: message,
          recipientId: admin.id,
          triggeredById: null,
          metadata: {
            alertType: type,
            timestamp: new Date(),
            data: data
          }
        }
      });
    }

    console.log(`🚨 Created system alert: ${type} - ${message}`);
  } catch (error) {
    console.error('Failed to create system alert:', error);
  }
};

/**
 * Schedule the system health monitoring job
 * Runs every 15 minutes
 */
const scheduleMonitorSystemHealth = () => {
  // Run immediately on startup
  monitorSystemHealth();
  
  // Schedule to run every 15 minutes
  cron.schedule('*/15 * * * *', monitorSystemHealth, {
    scheduled: true,
    timezone: 'Africa/Johannesburg'
  });
  
  console.log('📅 Scheduled system health monitoring job (every 15 minutes)');
};

module.exports = scheduleMonitorSystemHealth;