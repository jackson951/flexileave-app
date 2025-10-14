const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs"); // npm install bcryptjs

const prisma = new PrismaClient();

async function main() {
  // Hash the admin password
  const hashedPassword = await bcrypt.hash("Kgaogelo#99", 10); // replace with your desired password

  const adminUser = await prisma.user.upsert({
    where: { email: "jacksonk@digititan.co.za" },
    update: {},
    create: {
      name: "Jackson Khuto",
      email: "jacksonk@digititan.co.za",
      phone: "+27 661802747",
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
      avatar: "https://i.pravatar.cc/150?img=3",
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
