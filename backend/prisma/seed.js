require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs"); // npm install bcryptjs
const { DEFAULT_LEAVE_BALANCES } = require("../constants/leaveBalances");

const prisma = new PrismaClient();

async function main() {
  // Hash the admin password
  const hashedPassword = await bcrypt.hash("Kgaogelo#99", 10); // replace with your desired password

  const defaultTenantSlug = (
    process.env.DEFAULT_TENANT_SLUG || "flexileave"
  ).toLowerCase();
  const defaultTenantName = process.env.DEFAULT_TENANT_NAME || "FlexiLeave";

  const tenant = await prisma.tenant.upsert({
    where: { slug: defaultTenantSlug },
    update: { name: defaultTenantName },
    create: {
      name: defaultTenantName,
      slug: defaultTenantSlug,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: "jacksonk@digititan.co.za",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Jackson Khuto",
      email: "jacksonk@digititan.co.za",
      phone: "+27 661802747",
      department: "IT",
      position: "Administrator",
      joinDate: new Date("2023-01-01"),
      leaveBalances: { ...DEFAULT_LEAVE_BALANCES },
      role: "ADMIN",
      status: "ACTIVE",
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
