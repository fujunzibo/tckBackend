import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PrismaService } from "./prisma/prisma.service";
import { passwordHash } from "./common/util";
import { rolePermissions } from "./auth/guard";
async function main() {
  const username = process.env.NEW_ADMIN_USERNAME,
    password = process.env.NEW_ADMIN_PASSWORD,
    role = process.env.NEW_ADMIN_ROLE ?? "auditor";
  const entryIds = (process.env.NEW_ADMIN_ENTRIES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (
    !username ||
    !password ||
    password.length < 12 ||
    !rolePermissions[role] ||
    (role === "project_operator" && !entryIds.length)
  )
    throw new Error(
      "Set NEW_ADMIN_USERNAME/PASSWORD/ROLE and project entry scope",
    );
  const app = await NestFactory.createApplicationContext(AppModule),
    db = app.get(PrismaService);
  try {
    await db.serial(async (tx) => {
      const admin = await tx.admin.create({
        data: {
          username,
          passwordHash: passwordHash(password),
          role,
          entryIds,
        },
      });
      await tx.auditLog.create({
        data: {
          actor: "admin-cli",
          action: "admin.create",
          target: admin.id,
          reason: `Create ${role}`,
          requestId: "admin-cli",
        },
      });
    });
    console.log("Administrator created");
  } finally {
    await app.close();
  }
}
void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Create administrator failed",
  );
  process.exitCode = 1;
});
