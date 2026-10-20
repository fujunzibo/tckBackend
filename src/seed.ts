import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PrismaService } from "./prisma/prisma.service";
import { LedgerService } from "./assets/ledger.service";
import { seed } from "./seed.service";
async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    await seed(
      app.get(PrismaService),
      app.get(LedgerService),
      process.env.ADMIN_USERNAME ?? "admin",
      process.env.ADMIN_PASSWORD,
    );
    console.log(
      "Demo catalog, budgets and administrator initialized. Existing data retained.",
    );
  } finally {
    await app.close();
  }
}
void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seed failed");
  process.exitCode = 1;
});
