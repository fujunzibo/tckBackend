import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { WorkerService } from "./jobs/worker.service";
async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const config = app.get(ConfigService),
    worker = app.get(WorkerService);
  if (config.get("WORKER_ENABLED", "true") !== "true") {
    console.log("Worker disabled");
    await app.close();
    return;
  }
  let running = true;
  const stop = () => {
    running = false;
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  console.log(`Worker ${worker.id} started`);
  try {
    while (running) {
      try {
        const worked = await worker.tick();
        if (worked) continue;
      } catch (error) {
        console.error(
          JSON.stringify({
            type: "worker.tick.failed",
            error: error instanceof Error ? error.name : "UnknownError",
          }),
        );
      }
      await new Promise((resolve) =>
        setTimeout(resolve, Number(config.get("WORKER_INTERVAL_MS", 500))),
      );
    }
  } finally {
    await app.close();
  }
}
void main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Worker startup failed",
  );
  process.exitCode = 1;
});
