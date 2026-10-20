"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const express_1 = require("express");
const node_crypto_1 = require("node:crypto");
const app_module_1 = require("./app.module");
const http_1 = require("./common/http");
async function createApp() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bodyParser: false });
    const config = app.get(config_1.ConfigService), logger = new common_1.Logger("Request");
    const prefix = config.get("API_PREFIX", "/api/v1").replace(/^\/+/, "");
    app.use((req, res, next) => {
        req.requestId = (0, node_crypto_1.randomUUID)();
        res.setHeader("X-Request-Id", req.requestId);
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
        const started = Date.now();
        res.on("finish", () => logger.log(JSON.stringify({
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            elapsedMs: Date.now() - started,
        })));
        next();
    });
    app.use((0, express_1.json)({ limit: "64kb", strict: true }));
    app.enableCors({
        origin: config
            .get("APP_ORIGIN", "http://127.0.0.1:3001")
            .split(",")
            .map((x) => x.trim()),
        methods: ["GET", "POST", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
        exposedHeaders: ["X-Request-Id"],
    });
    app.setGlobalPrefix(prefix);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new http_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new http_1.ResponseInterceptor());
    app.enableShutdownHooks();
    const document = swagger_1.SwaggerModule.createDocument(app, new swagger_1.DocumentBuilder()
        .setTitle("TCK Wins API")
        .setDescription("P0 · PostgreSQL persisted demo, separate Worker; no real funds")
        .setVersion("0.1.0")
        .addBearerAuth()
        .build());
    swagger_1.SwaggerModule.setup(`${prefix}/docs`, app, document);
    return app;
}
//# sourceMappingURL=bootstrap.js.map