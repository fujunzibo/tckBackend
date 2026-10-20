"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseInterceptor = exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let HttpExceptionFilter = class HttpExceptionFilter {
    logger = new common_1.Logger("HTTP");
    catch(exception, host) {
        const request = host.switchToHttp().getRequest(), response = host.switchToHttp().getResponse();
        const code = exception?.code;
        const parserStatus = exception?.status;
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : [400, 413].includes(parserStatus ?? 0)
                ? parserStatus
                : ["P2034", "P2002"].includes(code ?? "")
                    ? 409
                    : 500;
        const body = exception instanceof common_1.HttpException ? exception.getResponse() : {};
        const error = typeof body === "object"
            ? body
            : {};
        if (status >= 500)
            this.logger.error(JSON.stringify({
                requestId: request.requestId,
                method: request.method,
                path: request.path,
                exception: exception instanceof Error ? exception.name : "UnknownError",
                code,
            }));
        response.status(status).json({
            success: false,
            data: null,
            error: {
                code: error.code ??
                    {
                        400: "VALIDATION_ERROR",
                        401: "UNAUTHORIZED",
                        403: "FORBIDDEN",
                        404: "NOT_FOUND",
                        409: "STATE_CONFLICT",
                        429: "RATE_LIMITED",
                    }[status] ??
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
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
let ResponseInterceptor = class ResponseInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        return next.handle().pipe((0, rxjs_1.map)((data) => ({
            success: true,
            data,
            error: null,
            requestId: request.requestId,
        })));
    }
};
exports.ResponseInterceptor = ResponseInterceptor;
exports.ResponseInterceptor = ResponseInterceptor = __decorate([
    (0, common_1.Injectable)()
], ResponseInterceptor);
//# sourceMappingURL=http.js.map