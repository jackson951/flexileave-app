const { getPrismaClient } = require("./prismaClient");
const prisma = getPrismaClient();

const createNotification = async ({
  type,
  title,
  message,
  recipientId,
  triggeredById,
  tenantId,
  leaveId = null,
  metadata = null,
}) => {
  if (!recipientId || !tenantId) {
    return null;
  }
  if (recipientId === triggeredById) {
    return null;
  }

  return prisma.notification.create({
    data: {
      type,
      title,
      message,
      recipientId,
      triggeredById,
      tenantId,
      leaveId,
      metadata,
    },
  });
};

module.exports = { createNotification };
