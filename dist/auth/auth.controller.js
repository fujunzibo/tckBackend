"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dto_1 = require("../common/dto");
const guard_1 = require("./guard");
const auth_service_1 = require("./auth.service");
let AuthController = class AuthController {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    login(dto, r) {
        return this.auth.login(dto, r.ip ?? "unknown");
    }
    adminLogin(dto, r) {
        return this.auth.adminLogin(dto, r.ip ?? "unknown", r.requestId);
    }
    me(r) {
        return this.auth.me(r.actor);
    }
    adminMe(r) {
        return this.auth.me(r.actor);
    }
    logout(_dto, r) {
        return this.auth.logout(r.actor);
    }
    adminLogout(_dto, r) {
        return this.auth.logout(r.actor);
    }
    nonce(dto, r) {
        return this.auth.walletNonce(dto, r.ip ?? "unknown", r.header("origin"), r.header("referer"));
    }
    walletLogin(dto, r) {
        return this.auth.walletLogin(dto, r.ip ?? "unknown");
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Post)("auth/demo-login"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Post)("admin/auth/login"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AdminLoginDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "adminLogin", null);
__decorate([
    (0, guard_1.Access)("user"),
    (0, common_1.Get)("auth/me"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, guard_1.Access)("admin"),
    (0, common_1.Get)("admin/auth/me"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "adminMe", null);
__decorate([
    (0, guard_1.Access)("user"),
    (0, common_1.Post)("auth/logout"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.EmptyDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, guard_1.Access)("admin"),
    (0, common_1.Post)("admin/auth/logout"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.EmptyDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "adminLogout", null);
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Post)("auth/nonce"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.WalletNonceDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "nonce", null);
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Post)("auth/login"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.WalletLoginDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "walletLogin", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)("Authentication"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map