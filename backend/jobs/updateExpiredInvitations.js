const cron = require('node-cron');
const { getPrismaClient } = require('../utils/prismaClient');

const prisma = getPrismaClient();

/**
 * Job to update invitation status to expired for invitations that have passed their expiry date
 * Runs every hour
 */
const updateExpiredInvitations = async () => {
  try {
    const now = new Date();
    
    // Find invitations that haven't been used and have expired
    // Note: UserInvitation model doesn't have a status field, so we can't update status
    // This job is not applicable with the current schema
    console.log('ℹ️ Update expired invitations job skipped - UserInvitation model has no status field');
    return;
  } catch (error) {
    console.error('Failed to update expired invitations:', error);
  }
};

/**
 * Schedule the expired invitation update job
 * Runs every hour at minute 0
 */
const scheduleUpdateExpiredInvitations = () => {
  // Run immediately on startup
  updateExpiredInvitations();
  
  // Schedule to run every hour
  cron.schedule('0 * * * *', updateExpiredInvitations, {
    scheduled: true,
    timezone: 'Africa/Johannesburg'
  });
  
  console.log('📅 Scheduled expired invitation status update job (every hour)');
};

module.exports = scheduleUpdateExpiredInvitations;