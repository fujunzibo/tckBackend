import {
  ArgumentsHost,
  CallHandler,
  Catch,
  ExceptionFilter,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import type { Response } from "express";
import { map } from "rxjs";
import type { ApiRequest } from "../auth/types";
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("HTTP");
  catch(exception: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<ApiRequest>(),
      response = host.switchToHttp().getResponse<Response>();
    const code = (exception as { code?: string })?.code;
    const parserStatus = (exception as { status?: number })?.status;
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : [400, 413].includes(parserStatus ?? 0)
          ? parserStatus!
          : ["P2034", "P2002"].includes(code ?? "")
            ? 409
            : 500;
    const body =
      exception instanceof HttpException ? exception.getResponse() : {};
    const error =
      typeof body === "object"
        ? (body as { code?: string; message?: string | string[] })
        : {};
    if (status >= 500)
      this.logger.error(
        JSON.stringify({
          requestId: request.requestId,
          method: request.method,
          path: request.path,
          exception:
            exception instanceof Error ? exception.name : "UnknownError",
          code,
        }),
      );
    response.status(status).json({
      success: false,
      data: null,
      error: {
        code:
          error.code ??
          (
            {
              400: "VALIDATION_ERROR",
              401: "UNAUTHORIZED",
              403: "FORBIDDEN",
              404: "NOT_FOUND",
              409: "STATE_CONFLICT",
              429: "RATE_LIMITED",
            } as Record<number, string>
          )[status] ??
          "INTERNAL_ERROR",
        message: Array.isArray(error.message)
          ? error.message.join("; ")
          : error.message ??
            (status === 409
              ? "Concurrent change; retry the operation"
              : "Service temporarily unavailable"),
      },
      requestId: request.requestId,
    });
  }
}
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<ApiRequest>();
    return next.handle().pipe(
      map((data: unknown) => ({
        success: true,
        data,
        error: null,
        requestId: request.requestId,
      })),
    );
  }
}
