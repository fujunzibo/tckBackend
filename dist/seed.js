"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const prisma_service_1 = require("./prisma/prisma.service");
const ledger_service_1 = require("./assets/ledger.service");
const seed_service_1 = require("./seed.service");
async function main() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    try {
        await (0, seed_service_1.seed)(app.get(prisma_service_1.PrismaService), app.get(ledger_service_1.LedgerService), process.env.ADMIN_USERNAME ?? "admin", process.env.ADMIN_PASSWORD);
        console.log("Demo catalog, budgets and administrator initialized. Existing data retained.");
    }
    finally {
        await app.close();
    }
}
void main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Seed failed");
    process.exitCode = 1;
});
//# sourceMappingURL=seed.js.map