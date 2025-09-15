// backend/scripts/list-users.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true }
    });
    console.table(users.map(u => ({ id: u.id, email: `"${u.email}"`, name: u.name, createdAt: u.createdAt })));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
