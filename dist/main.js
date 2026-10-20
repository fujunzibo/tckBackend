"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const config_1 = require("@nestjs/config");
const bootstrap_1 = require("./bootstrap");
async function main() {
    const app = await (0, bootstrap_1.createApp)();
    const config = app.get(config_1.ConfigService);
    await app.listen(Number(config.get("PORT", 4001)), config.get("HOST", "127.0.0.1"));
}
void main().catch((error) => {
    console.error(error instanceof Error ? error.message : "API startup failed");
    process.exitCode = 1;
});
//# sourceMappingURL=main.js.map