import { HttpException } from "@nestjs/common";
export declare class ApiError extends HttpException {
    constructor(status: number, code: string, message: string);
}
export declare function fail(status: number, code: string, message: string): never;
export declare function requireValue<T>(value: T | null | undefined): T;
