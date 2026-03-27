const cron = require('node-cron');
const { getPrismaClient } = require('../utils/prismaClient');
const { sendEmail } = require('../utils/emailer');

const prisma = getPrismaClient();

/**
 * Job to send leave reminder notifications
 * Runs daily at 9 AM
 */
const sendLeaveReminders = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    // Find approved leaves starting tomorrow
    const tomorrowLeaves = await prisma.leave.findMany({
      where: {
        status: 'APPROVED',
        startDate: {
          gte: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()),
          lt: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1)
        }
      },
      include: {
        user: true,
        tenant: true
      }
    });

    // Find approved leaves starting within the next week
    const upcomingLeaves = await prisma.leave.findMany({
      where: {
        status: 'APPROVED',
        startDate: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          lt: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate() + 1)
        }
      },
      include: {
        user: true,
        tenant: true
      }
    });

    let notificationsCreated = 0;

    // Send reminders for leaves starting tomorrow
    for (const leave of tomorrowLeaves) {
      try {
        // Create notification
        await prisma.notification.create({
          data: {
            tenantId: leave.tenantId,
            type: 'system',
            title: 'Leave Reminder',
            message: `Your leave starts tomorrow (${leave.leaveType}) from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()}.`,
            recipientId: leave.userId,
            triggeredById: null,
            leaveId: leave.id
          }
        });

        // Send email notification
        if (leave.user.email) {
          await sendEmail({
            to: leave.user.email,
            subject: 'Leave Starting Tomorrow - Reminder',
            html: `
              <h2>Leave Reminder</h2>
              <p>Hi ${leave.user.name},</p>
              <p>This is a reminder that your ${leave.leaveType} leave starts tomorrow.</p>
              <p><strong>Details:</strong></p>
              <ul>
                <li>Type: ${leave.leaveType}</li>
                <li>Start Date: ${leave.startDate.toDateString()}</li>
                <li>End Date: ${leave.endDate.toDateString()}</li>
                <li>Days: ${leave.days}</li>
                <li>Reason: ${leave.reason}</li>
              </ul>
              <p>Have a great time off!</p>
              <p>Best regards,<br>${leave.tenant.name} Team</p>
            `
          });
        }

        notificationsCreated++;
      } catch (error) {
        console.error(`Failed to send reminder for leave ${leave.id}:`, error);
      }
    }

    // Send notifications for upcoming leaves (next week)
    for (const leave of upcomingLeaves) {
      try {
        await prisma.notification.create({
          data: {
            tenantId: leave.tenantId,
            type: 'system',
            title: 'Upcoming Leave',
            message: `You have ${leave.leaveType} leave starting on ${leave.startDate.toDateString()}.`,
            recipientId: leave.userId,
            triggeredById: null,
            leaveId: leave.id
          }
        });
        notificationsCreated++;
      } catch (error) {
        console.error(`Failed to create notification for leave ${leave.id}:`, error);
      }
    }

    if (notificationsCreated > 0) {
      console.log(`📧 Sent ${notificationsCreated} leave reminder notifications`);
    }
  } catch (error) {
    console.error('Failed to send leave reminders:', error);
  }
};

/**
 * Schedule the leave reminder job
 * Runs daily at 9 AM
 */
const scheduleSendLeaveReminders = () => {
  // Run immediately on startup
  sendLeaveReminders();
  
  // Schedule to run daily at 9 AM
  cron.schedule('0 9 * * *', sendLeaveReminders, {
    scheduled: true,
    timezone: 'Africa/Johannesburg'
  });
  
  console.log('📅 Scheduled leave reminder job (daily at 9 AM)');
};

module.exports = scheduleSendLeaveReminders;