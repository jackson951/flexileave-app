const scheduleUpdateExpiredInvitations = require('./updateExpiredInvitations');
const scheduleCleanupExpiredInvitations = require('./cleanupExpiredInvitations');
const scheduleSendLeaveReminders = require('./sendLeaveReminders');
const scheduleResetAnnualLeaveBalances = require('./resetAnnualLeaveBalances');
const scheduleGenerateMonthlyReports = require('./generateMonthlyReports');
const scheduleCleanupOldNotifications = require('./cleanupOldNotifications');
const scheduleMonitorSystemHealth = require('./monitorSystemHealth');

/**
 * Job Scheduler Manager
 * 
 * This module initializes and manages all cron jobs for the flexileave application.
 * It provides a centralized way to start, stop, and manage all background tasks.
 */

class JobScheduler {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Initialize all jobs
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Job scheduler is already running');
      return;
    }

    console.log('🚀 Starting job scheduler...');

    try {
      // Start all individual job schedulers
      scheduleUpdateExpiredInvitations();
      scheduleCleanupExpiredInvitations();
      scheduleSendLeaveReminders();
      scheduleResetAnnualLeaveBalances();
      scheduleGenerateMonthlyReports();
      scheduleCleanupOldNotifications();
      scheduleMonitorSystemHealth();

      this.isRunning = true;
      console.log('✅ All jobs have been scheduled successfully');
      
      // Log all scheduled jobs
      this.logScheduledJobs();

    } catch (error) {
      console.error('❌ Failed to start job scheduler:', error);
      this.isRunning = false;
    }
  }

  /**
   * Stop all jobs
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Job scheduler is not running');
      return;
    }

    console.log('🛑 Stopping job scheduler...');
    
    // Stop all cron jobs
    const cron = require('node-cron');
    cron.destroy();
    
    this.isRunning = false;
    console.log('✅ All jobs have been stopped');
  }

  /**
   * Log information about all scheduled jobs
   */
  logScheduledJobs() {
    console.log('\n📋 Scheduled Jobs:');
    console.log('├─ Update Expired Invitations: Every hour at minute 0');
    console.log('├─ Cleanup Expired Invitations: Daily at 2:00 AM');
    console.log('├─ Send Leave Reminders: Daily at 9:00 AM');
    console.log('├─ Reset Annual Leave Balances: Annually on January 1st at midnight');
    console.log('├─ Generate Monthly Reports: 1st of every month at 8:00 AM');
    console.log('├─ Cleanup Old Notifications: Weekly on Sundays at 3:00 AM');
    console.log('├─ Mark Old Notifications as Read: Weekly on Sundays at 3:30 AM');
    console.log('└─ Monitor System Health: Every 15 minutes');
    console.log('');
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobsCount: this.jobs.length,
      timezone: 'Africa/Johannesburg'
    };
  }
}

// Create singleton instance
const jobScheduler = new JobScheduler();

// Auto-start if this file is run directly
if (require.main === module) {
  jobScheduler.start();
}

module.exports = jobScheduler;