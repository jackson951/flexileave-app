// scripts/fix-emails.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany();
    for (const u of users) {
      const fixed = u.email.replace(/^"+|"+$/g, "").trim();
      if (u.email !== fixed) {
        console.log(`Fixing email for id=${u.id}: ${u.email} -> ${fixed}`);
        await prisma.user.update({
          where: { id: u.id },
          data: { email: fixed },
        });
      }
    }
    console.log("🎉 Emails fixed!");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
