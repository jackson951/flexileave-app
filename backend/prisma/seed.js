const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs"); // npm install bcryptjs

const prisma = new PrismaClient();

async function main() {
  // Hash the admin password
  const hashedPassword = await bcrypt.hash("Admin@123", 10); // replace with your desired password

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@digititan.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@digititan.com",
      phone: "+1 (555) 000-0000",
      department: "IT",
      position: "Administrator",
      joinDate: new Date("2023-01-01"),
      leaveBalances: {
        AnnualLeave: 15,
        SickLeave: 10,
        FamilyResponsibility: 5,
        UnpaidLeave: 0,
        Other: 3,
      },
      role: "admin",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      password: hashedPassword, // <-- hashed password
    },
  });

  console.log("Seeded admin user:", adminUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
