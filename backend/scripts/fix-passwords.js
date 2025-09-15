// scripts/fix-passwords.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function fixPasswords() {
  try {
    const users = await prisma.user.findMany();

    for (const user of users) {
      const pwd = user.password;

      // bcrypt hashes always start with $2
      if (
        !pwd.startsWith("$2a$") &&
        !pwd.startsWith("$2b$") &&
        !pwd.startsWith("$2y$")
      ) {
        console.log(`🔧 Re-hashing password for user: ${user.email}`);

        const hashed = await bcrypt.hash(pwd, 10);

        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashed },
        });
      } else {
        console.log(`✅ Already hashed: ${user.email}`);
      }
    }

    console.log("🎉 Passwords fixed successfully.");
  } catch (err) {
    console.error("❌ Error fixing passwords:", err);
  } finally {
    await prisma.$disconnect();
  }
}

fixPasswords();
