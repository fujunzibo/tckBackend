"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const prisma_service_1 = require("./prisma/prisma.service");
const util_1 = require("./common/util");
const guard_1 = require("./auth/guard");
async function main() {
    const username = process.env.NEW_ADMIN_USERNAME, password = process.env.NEW_ADMIN_PASSWORD, role = process.env.NEW_ADMIN_ROLE ?? "auditor";
    const entryIds = (process.env.NEW_ADMIN_ENTRIES ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    if (!username ||
        !password ||
        password.length < 12 ||
        !guard_1.rolePermissions[role] ||
        (role === "project_operator" && !entryIds.length))
        throw new Error("Set NEW_ADMIN_USERNAME/PASSWORD/ROLE and project entry scope");
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule), db = app.get(prisma_service_1.PrismaService);
    try {
        await db.serial(async (tx) => {
            const admin = await tx.admin.create({
                data: {
                    username,
                    passwordHash: (0, util_1.passwordHash)(password),
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
    }
    finally {
        await app.close();
    }
}
void main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Create administrator failed");
    process.exitCode = 1;
});
//# sourceMappingURL=admin-cli.js.map