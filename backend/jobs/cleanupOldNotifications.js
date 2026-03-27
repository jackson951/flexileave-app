const cron = require('node-cron');
const { getPrismaClient } = require('../utils/prismaClient');

const prisma = getPrismaClient();

/**
 * Job to clean up old notifications that are older than 6 months
 * Runs weekly on Sundays at 3 AM
 */
const cleanupOldNotifications = async () => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
    
    // Find and delete notifications older than 6 months
    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: sixMonthsAgo
        },
        isRead: true
      }
    });

    if (result.count > 0) {
      console.log(`🗑️ Cleaned up ${result.count} old notifications (older than 6 months)`);
    }
  } catch (error) {
    console.error('Failed to clean up old notifications:', error);
  }
};

/**
 * Job to mark very old unread notifications as read to prevent notification overload
 * Runs weekly on Sundays at 3:30 AM
 */
const markVeryOldNotificationsAsRead = async () => {
  try {
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
    
    // Mark notifications older than 1 year as read
    const result = await prisma.notification.updateMany({
      where: {
        createdAt: {
          lt: oneYearAgo
        },
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    if (result.count > 0) {
      console.log(`✓ Marked ${result.count} very old notifications as read (older than 1 year)`);
    }
  } catch (error) {
    console.error('Failed to mark old notifications as read:', error);
  }
};

/**
 * Schedule the notification cleanup jobs
 * Runs weekly on Sundays
 */
const scheduleCleanupOldNotifications = () => {
  // Clean up old notifications on Sundays at 3 AM
  cron.schedule('0 3 * * 0', cleanupOldNotifications, {
    scheduled: true,
    timezone: 'Africa/Johannesburg'
  });
  
  // Mark very old notifications as read on Sundays at 3:30 AM
  cron.schedule('30 3 * * 0', markVeryOldNotificationsAsRead, {
    scheduled: true,
    timezone: 'Africa/Johannesburg'
  });
  
  console.log('📅 Scheduled notification cleanup jobs (weekly on Sundays)');
};

module.exports = scheduleCleanupOldNotifications;