const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // every 15 minutes

const cleanupExpiredInvites = async () => {
  try {
    const now = new Date();
    const result = await prisma.userInvitation.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
        used: false,
      },
    });

    if (result.count > 0) {
      console.log(`? Removed ${result.count} expired invitations`);
    }
  } catch (error) {
    console.error("Expired invite cleanup failed:", error);
  }
};

const startExpiredInvitationCleanup = () => {
  cleanupExpiredInvites();
  setInterval(cleanupExpiredInvites, CLEANUP_INTERVAL_MS);
};

module.exports = startExpiredInvitationCleanup;
