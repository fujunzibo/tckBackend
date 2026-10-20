"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.fail = fail;
exports.requireValue = requireValue;
const common_1 = require("@nestjs/common");
class ApiError extends common_1.HttpException {
    constructor(status, code, message) {
        super({ code, message }, status);
    }
}
exports.ApiError = ApiError;
function fail(status, code, message) {
    throw new ApiError(status, code, message);
}
function requireValue(value) {
    if (value == null)
        fail(404, "NOT_FOUND", "Record not found");
    return value;
}
//# sourceMappingURL=errors.js.map