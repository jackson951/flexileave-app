# Flexileave App Jobs

This directory contains all the background jobs and scheduled tasks for the flexileave application, implemented using `node-cron`.

## Jobs Overview

### 1. Update Expired Invitations (`updateExpiredInvitations.js`)
- **Schedule**: Every hour at minute 0
- **Purpose**: Updates invitation status to "EXPIRED" for invitations that have passed their expiry date
- **Database Impact**: Updates `userInvitation` records

### 2. Cleanup Expired Invitations (`cleanupExpiredInvitations.js`)
- **Schedule**: Daily at 2:00 AM
- **Purpose**: Removes expired invitations that have been expired for more than 3 days
- **Database Impact**: Deletes `userInvitation` records

### 3. Send Leave Reminders (`sendLeaveReminders.js`)
- **Schedule**: Daily at 9:00 AM
- **Purpose**: Sends notifications and emails for leaves starting tomorrow and within the next week
- **Database Impact**: Creates `notification` records, sends emails

### 4. Reset Annual Leave Balances (`resetAnnualLeaveBalances.js`)
- **Schedule**: Annually on January 1st at midnight
- **Purpose**: Resets leave balances for all users at the beginning of each year
- **Database Impact**: Updates `user.leaveBalances`, creates `notification` records

### 5. Generate Monthly Reports (`generateMonthlyReports.js`)
- **Schedule**: 1st of every month at 8:00 AM
- **Purpose**: Generates and emails monthly analytics reports to administrators
- **Database Impact**: Reads analytics data, sends emails

### 6. Cleanup Old Notifications (`cleanupOldNotifications.js`)
- **Schedule**: Weekly on Sundays at 3:00 AM (cleanup) and 3:30 AM (mark as read)
- **Purpose**: 
  - Removes notifications older than 6 months that are marked as read
  - Marks notifications older than 1 year as read to prevent overload
- **Database Impact**: Deletes and updates `notification` records

### 7. Monitor System Health (`monitorSystemHealth.js`)
- **Schedule**: Every 15 minutes
- **Purpose**: Monitors system performance and detects critical issues
- **Checks**:
  - Memory usage
  - Database connectivity
  - Pending leaves older than 7 days
  - Expired invitations not marked as expired
  - Users with negative leave balances
- **Database Impact**: Creates `notification` records for alerts

## Job Scheduler

The `jobScheduler.js` file provides a centralized manager for all jobs with the following features:

- **Start/Stop Control**: Start or stop all jobs at once
- **Status Monitoring**: Check if jobs are running and how many are scheduled
- **Logging**: Comprehensive logging of all scheduled jobs
- **Error Handling**: Graceful handling of job initialization failures

## Usage

### Starting Jobs
Jobs are automatically started when the server starts via the server.js file:

```javascript
const jobScheduler = require("./jobs/jobScheduler");
jobScheduler.start();
```

### Manual Control
You can also control jobs manually:

```javascript
const jobScheduler = require("./jobs/jobScheduler");

// Start all jobs
jobScheduler.start();

// Stop all jobs
jobScheduler.stop();

// Get status
const status = jobScheduler.getStatus();
console.log(status);
```

### Individual Job Control
Each job can also be started individually:

```javascript
const scheduleUpdateExpiredInvitations = require("./jobs/updateExpiredInvitations");
scheduleUpdateExpiredInvitations();
```

## Timezone

All jobs are scheduled using the `Africa/Johannesburg` timezone to ensure consistency across different server environments.

## Error Handling

Each job includes comprehensive error handling:
- Database connection errors
- Email sending failures
- System resource issues
- Invalid data handling

Errors are logged to the console and do not crash the application.

## Monitoring

The system health monitor provides real-time monitoring of:
- Memory usage
- Database response times
- Pending approval counts
- System issues and anomalies

## Best Practices

1. **Error Resilience**: Jobs continue running even if individual tasks fail
2. **Resource Management**: Jobs are designed to be lightweight and not impact server performance
3. **Logging**: All job activities are logged for monitoring and debugging
4. **Timezone Consistency**: All jobs use the same timezone to avoid scheduling conflicts
5. **Database Safety**: Jobs use proper database transactions and error handling

## Adding New Jobs

To add a new job:

1. Create a new job file in the `jobs` directory
2. Export a function that schedules the job using `node-cron`
3. Add the job to the `jobScheduler.js` file
4. Update this README with the new job details

Example job structure:

```javascript
const cron = require('node-cron');
const { getPrismaClient } = require('../utils/prismaClient');

const prisma = getPrismaClient();

const myJob = async () => {
  try {
    // Job logic here
  } catch (error) {
    console.error('Job failed:', error);
  }
};

const scheduleMyJob = () => {
  cron.schedule('0 12 * * *', myJob, {
    scheduled: true,
    timezone: 'Africa/Johannesburg'
  });
  console.log('Scheduled my job (daily at noon)');
};

module.exports = scheduleMyJob;