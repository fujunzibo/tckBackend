import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { createApp } from "./bootstrap";
async function main() {
  const app = await createApp();
  const config = app.get(ConfigService);
  await app.listen(
    Number(config.get("PORT", 4001)),
    config.get<string>("HOST", "127.0.0.1"),
  );
}
void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "API startup failed");
  process.exitCode = 1;
});
