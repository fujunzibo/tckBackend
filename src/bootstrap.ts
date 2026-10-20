import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json as jsonBody } from "express";
import { randomUUID } from "node:crypto";
import type { NextFunction, Response } from "express";
import type { ApiRequest } from "./auth/types";
import { AppModule } from "./app.module";
import { HttpExceptionFilter, ResponseInterceptor } from "./common/http";
export async function createApp() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService),
    logger = new Logger("Request");
  const prefix = config.get("API_PREFIX", "/api/v1").replace(/^\/+/, "");
  app.use((req: ApiRequest, res: Response, next: NextFunction) => {
    req.requestId = randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const started = Date.now();
    res.on("finish", () =>
      logger.log(
        JSON.stringify({
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          elapsedMs: Date.now() - started,
        }),
      ),
    );
    next();
  });
  app.use(jsonBody({ limit: "64kb", strict: true }));
  app.enableCors({
    origin: config
      .get<string>("APP_ORIGIN", "http://127.0.0.1:3001")
      .split(",")
      .map((x) => x.trim()),
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    exposedHeaders: ["X-Request-Id"],
  });
  app.setGlobalPrefix(prefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.enableShutdownHooks();
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("TCK Wins API")
      .setDescription(
        "P0 · PostgreSQL persisted demo, separate Worker; no real funds",
      )
      .setVersion("0.1.0")
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup(`${prefix}/docs`, app, document);
  return app;
}
