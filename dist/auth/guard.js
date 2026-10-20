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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = exports.rolePermissions = exports.Access = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const errors_1 = require("../common/errors");
const Access = (domain, permission = "") => (0, common_1.SetMetadata)("access", { domain, permission });
exports.Access = Access;
exports.rolePermissions = {
    system: ["*"],
    quest_operator: ["quests.read", "quests.write", "users.read"],
    reward_operator: [
        "quests.read",
        "rewards.read",
        "rewards.write",
        "users.read",
        "ledger.read",
    ],
    project_operator: ["catalog.read", "quests.read", "quests.write"],
    auditor: [
        "overview.read",
        "users.read",
        "catalog.read",
        "activity.read",
        "quests.read",
        "rewards.read",
        "ledger.read",
        "audit.read",
        "settings.read",
        "legacy.read",
        "jobs.read",
    ],
};
let AuthGuard = class AuthGuard {
    reflector;
    jwt;
    config;
    db;
    constructor(reflector, jwt, config, db) {
        this.reflector = reflector;
        this.jwt = jwt;
        this.config = config;
        this.db = db;
    }
    async canActivate(context) {
        const access = this.reflector.getAllAndOverride("access", [context.getHandler(), context.getClass()]) ?? {
            domain: "user",
            permission: "",
        };
        if (access.domain === "public")
            return true;
        const request = context.switchToHttp().getRequest();
        const bearer = /^Bearer (\S+)$/i.exec(request.headers.authorization ?? "")?.[1];
        if (!bearer) {
            if (access.domain === "optional")
                return true;
            (0, errors_1.fail)(401, "UNAUTHORIZED", "Please sign in");
        }
        const domain = access.domain === "admin" ? "admin" : "user";
        let claims;
        try {
            claims = await this.jwt.verifyAsync(bearer, {
                secret: this.config.getOrThrow(`JWT_${domain.toUpperCase()}_SECRET`),
                algorithms: ["HS256"],
                issuer: this.config.get("APP_DOMAIN", "tck666.cc"),
                audience: `tck-wins-${domain}`,
            });
        }
        catch {
            (0, errors_1.fail)(401, "UNAUTHORIZED", "Invalid or expired access token");
        }
        if (!claims.sub || !claims.sid || claims.tokenType !== domain)
            (0, errors_1.fail)(401, "UNAUTHORIZED", "Invalid session domain");
        const actor = { id: claims.sub, sessionId: claims.sid, domain };
        if (domain === "admin") {
            const admin = await this.db.admin.findUnique({ where: { id: actor.id } });
            if (!admin?.enabled)
                (0, errors_1.fail)(403, "FORBIDDEN", "Administrator is disabled");
            actor.role = admin.role;
            actor.entryIds = admin.entryIds;
            const permissions = exports.rolePermissions[admin.role] ?? [];
            if (access.permission &&
                !permissions.includes("*") &&
                !permissions.includes(access.permission))
                (0, errors_1.fail)(403, "FORBIDDEN", "Permission denied");
        }
        await this.db.assertActor(this.db, actor);
        request.actor = actor;
        return true;
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], AuthGuard);
//# sourceMappingURL=guard.js.map