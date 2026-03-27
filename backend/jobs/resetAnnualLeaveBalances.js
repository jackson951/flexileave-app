const cron = require('node-cron');
const { getPrismaClient } = require('../utils/prismaClient');

const prisma = getPrismaClient();

/**
 * Job to reset annual leave balances for all users at the beginning of each year
 * Runs annually on January 1st at midnight
 */
const resetAnnualLeaveBalances = async () => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Only run if it's January 1st
    if (now.getMonth() !== 0 || now.getDate() !== 1) {
      return;
    }

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true
      }
    });

    let totalUsersUpdated = 0;

    for (const tenant of tenants) {
      // Get all active users for this tenant
      const users = await prisma.user.findMany({
        where: {
          tenantId: tenant.id,
          status: 'ACTIVE'
        }
      });

      for (const user of users) {
        try {
          // Calculate default leave balances based on user role or company policy
          // This is a basic implementation - you might want to customize this based on your business logic
          const defaultBalances = {
            annual: 20,      // 20 days annual leave
            sick: 10,        // 10 days sick leave
            compassionate: 3, // 3 days compassionate leave
            maternity: 90,   // 90 days maternity leave
            paternity: 10,   // 10 days paternity leave
            study: 5,        // 5 days study leave
            unpaid: 30       // 30 days unpaid leave
          };

          // Update user's leave balances
          await prisma.user.update({
            where: { id: user.id },
            data: {
              leaveBalances: defaultBalances
            }
          });

          // Create a notification for the user
          await prisma.notification.create({
            data: {
              tenantId: tenant.id,
              type: 'system',
              title: 'Annual Leave Balance Reset',
              message: `Your leave balances have been reset for ${currentYear}. You now have ${defaultBalances.annual} days of annual leave available.`,
              recipientId: user.id,
              triggeredById: null,
              metadata: {
                year: currentYear,
                balances: defaultBalances
              }
            }
          });

          totalUsersUpdated++;
        } catch (error) {
          console.error(`Failed to reset leave balance for user ${user.id}:`, error);
        }
      }
    }

    if (totalUsersUpdated > 0) {
      console.log(`🔄 Reset leave balances for ${totalUsersUpdated} users for year ${currentYear}`);
    }
  } catch (error) {
    console.error('Failed to reset annual leave balances:', error);
  }
};

/**
 * Schedule the annual leave balance reset job
 * Runs annually on January 1st at midnight
 */
const scheduleResetAnnualLeaveBalances = () => {
  // Schedule to run annually on January 1st at midnight
  cron.schedule('0 0 1 1 *', resetAnnualLeaveBalances, {
    scheduled: true,
    timezone: 'Africa/Johannesburg'
  });
  
  console.log('📅 Scheduled annual leave balance reset job (January 1st at midnight)');
};

module.exports = scheduleResetAnnualLeaveBalances;