const cron = require('node-cron');
const { getPrismaClient } = require('../utils/prismaClient');

const prisma = getPrismaClient();

/**
 * Job to clean up expired invitations that have been expired for more than 3 days
 * Runs daily at 2 AM
 */
const cleanupExpiredInvitations = async () => {
  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    // Find invitations that have been expired for more than 3 days
    const result = await prisma.userInvitation.deleteMany({
      where: {
        expiresAt: {
          lt: threeDaysAgo,
        },
        used: false
      },
    });

    if (result.count > 0) {
      console.log(`🗑️ Cleaned up ${result.count} expired invitations (older than 3 days)`);
    }
  } catch (error) {
    console.error('Failed to clean up expired invitations:', error);
  }
};

/**
 * Schedule the expired invitation cleanup job
 * Runs daily at 2 AM
 */
const scheduleCleanupExpiredInvitations = () => {
  // Run immediately on startup
  cleanupExpiredInvitations();
  
  // Schedule to run daily at 2 AM
  cron.schedule('0 2 * * *', cleanupExpiredInvitations, {
    scheduled: true,
    timezone: 'Africa/Johannesburg'
  });
  
  console.log('📅 Scheduled expired invitation cleanup job (daily at 2 AM)');
};

module.exports = scheduleCleanupExpiredInvitations;