// migrate-sqlite-to-postgres.js
import { PrismaClient as SQLiteClient } from "./prisma/client-sqlite/index.js";
import { PrismaClient as PostgresClient } from "@prisma/client";

const sqlite = new SQLiteClient();
const postgres = new PostgresClient();

async function migrate() {
  try {
    console.log("🔹 Starting migration...");

    // -------------------- Users --------------------
    const users = await sqlite.user.findMany();
    for (const user of users) {
      try {
        await postgres.user.create({
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            department: user.department,
            position: user.position,
            joinDate: user.joinDate,
            leaveBalances: user.leaveBalances,
            role: user.role,
            avatar: user.avatar,
            password: user.password,
            refreshToken: user.refreshToken,
            createdAt: user.createdAt,
          },
        });
      } catch (err) {
        if (err.code === "P2002") {
          console.log(`⚠️ User with id ${user.id} already exists, skipping.`);
        } else {
          throw err;
        }
      }
    }
    console.log("✅ Users migrated");

    // -------------------- Leaves --------------------
    const leaves = await sqlite.leave.findMany();
    for (const leave of leaves) {
      try {
        await postgres.leave.create({
          data: {
            id: leave.id,
            leaveType: leave.leaveType,
            startDate: leave.startDate,
            endDate: leave.endDate,
            days: leave.days,
            reason: leave.reason,
            status: leave.status,
            submittedAt: leave.submittedAt,
            rejectionReason: leave.rejectionReason,
            emergencyContact: leave.emergencyContact,
            emergencyPhone: leave.emergencyPhone,
            userId: leave.userId,
            actionedBy: leave.actionedBy,
          },
        });
      } catch (err) {
        if (err.code === "P2002") {
          console.log(`⚠️ Leave with id ${leave.id} already exists, skipping.`);
        } else {
          throw err;
        }
      }
    }
    console.log("✅ Leaves migrated");

    // -------------------- Files --------------------
    const files = await sqlite.file.findMany();
    for (const file of files) {
      try {
        await postgres.file.create({
          data: {
            id: file.id,
            name: file.name,
            url: file.url,
            size: file.size,
            type: file.type,
            uploadedAt: file.uploadedAt,
            leaveId: file.leaveId,
          },
        });
      } catch (err) {
        if (err.code === "P2002") {
          console.log(`⚠️ File with id ${file.id} already exists, skipping.`);
        } else {
          throw err;
        }
      }
    }
    console.log("✅ Files migrated");

    // -------------------- Notifications --------------------
    const notifications = await sqlite.notification.findMany();
    for (const note of notifications) {
      try {
        await postgres.notification.create({
          data: {
            id: note.id,
            type: note.type,
            title: note.title,
            message: note.message,
            isRead: note.isRead,
            createdAt: note.createdAt,
            recipientId: note.recipientId,
            triggeredById: note.triggeredById,
            leaveId: note.leaveId,
            metadata: note.metadata,
          },
        });
      } catch (err) {
        if (err.code === "P2002") {
          console.log(
            `⚠️ Notification with id ${note.id} already exists, skipping.`
          );
        } else {
          throw err;
        }
      }
    }
    console.log("✅ Notifications migrated");

    console.log("🎉 Migration finished successfully!");
  } catch (err) {
    console.error("❌ Migration error:", err);
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }
}

migrate();
