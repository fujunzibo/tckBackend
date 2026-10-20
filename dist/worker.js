"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const worker_service_1 = require("./jobs/worker.service");
async function main() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService), worker = app.get(worker_service_1.WorkerService);
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
                if (worked)
                    continue;
            }
            catch (error) {
                console.error(JSON.stringify({
                    type: "worker.tick.failed",
                    error: error instanceof Error ? error.name : "UnknownError",
                }));
            }
            await new Promise((resolve) => setTimeout(resolve, Number(config.get("WORKER_INTERVAL_MS", 500))));
        }
    }
    finally {
        await app.close();
    }
}
void main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Worker startup failed");
    process.exitCode = 1;
});
//# sourceMappingURL=worker.js.map