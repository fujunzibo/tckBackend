import { ArgumentsHost, CallHandler, ExceptionFilter, ExecutionContext, NestInterceptor } from "@nestjs/common";
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
}
export declare class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): import("rxjs").Observable<{
        success: boolean;
        data: unknown;
        error: null;
        requestId: string;
    }>;
}
