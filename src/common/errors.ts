import { HttpException } from "@nestjs/common";
export class ApiError extends HttpException {
  constructor(status: number, code: string, message: string) {
    super({ code, message }, status);
  }
}
export function fail(status: number, code: string, message: string): never {
  throw new ApiError(status, code, message);
}
export function requireValue<T>(value: T | null | undefined): T {
  if (value == null) fail(404, "NOT_FOUND", "Record not found");
  return value;
}
