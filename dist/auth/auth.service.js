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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const ledger_service_1 = require("../assets/ledger.service");
const errors_1 = require("../common/errors");
const util_1 = require("../common/util");
const views_1 = require("../common/views");
let AuthService = class AuthService {
    db;
    config;
    jwt;
    ledger;
    dummyHash = (0, util_1.passwordHash)((0, util_1.secret)());
    constructor(db, config, jwt, ledger) {
        this.db = db;
        this.config = config;
        this.jwt = jwt;
        this.ledger = ledger;
    }
    async throttle(ip, kind, limit) {
        const count = await this.db.serial(async (tx) => {
            const key = (0, util_1.hash)(`${kind}:${ip}`);
            await this.db.lock(tx, `rate:${key}`);
            const previous = await tx.rateLimit.findUnique({ where: { key } });
            return (await tx.rateLimit.upsert({
                where: { key },
                create: { key, count: 1, resetAt: new Date(Date.now() + 60000) },
                update: !previous || previous.resetAt <= new Date()
                    ? { count: 1, resetAt: new Date(Date.now() + 60000) }
                    : { count: { increment: 1 } },
            })).count;
        });
        if (count > limit)
            (0, errors_1.fail)(429, "RATE_LIMITED", "Too many attempts; try again in one minute");
    }
    async login(dto, ip) {
        if (this.config.get("PLATFORM_MODE", "demo") !== "demo" ||
            this.config.get("MOCK_AUTH_ENABLED", "true") !== "true")
            (0, errors_1.fail)(403, "FEATURE_DISABLED", "Demo authentication is disabled");
        await this.throttle(ip, "demo-login", 30);
        return this.db.serial(async (tx) => {
            const resumeSecret = dto.resumeSecret ?? (0, util_1.secret)();
            const identity = await tx.identity.findUnique({
                where: {
                    provider_subject: { provider: "demo", subject: (0, util_1.hash)(resumeSecret) },
                },
            });
            let user;
            if (dto.resumeSecret) {
                if (!identity)
                    (0, errors_1.fail)(401, "UNAUTHORIZED", "Identity recovery proof is invalid");
                user = (0, errors_1.requireValue)(await tx.user.findUnique({ where: { id: identity.userId } }));
                if (user.status !== "normal")
                    (0, errors_1.fail)(403, "USER_FROZEN", "Account is unavailable");
            }
            else {
                user = await tx.user.create({
                    data: {
                        nickname: dto.nickname.trim(),
                        invitationCode: (0, util_1.secret)().slice(0, 12).toUpperCase(),
                    },
                });
                await tx.identity.create({
                    data: {
                        provider: "demo",
                        subject: (0, util_1.hash)(resumeSecret),
                        userId: user.id,
                    },
                });
                await this.ledger.signup(tx, user.id);
                if (dto.ref)
                    await this.bind(tx, user.id, dto.ref, false);
                user = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
            }
            return {
                ...(await this.issue(tx, user.id, "user")),
                user: (0, views_1.userView)(user),
                resumeSecret,
            };
        });
    }
    async adminLogin(dto, ip, requestId) {
        await this.throttle(ip, "admin-login", 10);
        const admin = await this.db.admin.findUnique({
            where: { username: dto.username },
        });
        if (!(0, util_1.passwordMatches)(dto.password, admin?.passwordHash ?? this.dummyHash) ||
            !admin?.enabled)
            (0, errors_1.fail)(401, "UNAUTHORIZED", "Invalid administrator credentials");
        return this.db.serial(async (tx) => {
            const current = await tx.admin.findUniqueOrThrow({
                where: { id: admin.id },
            });
            if (!current.enabled || current.passwordHash !== admin.passwordHash)
                (0, errors_1.fail)(401, "UNAUTHORIZED", "Administrator credentials changed");
            await tx.auditLog.create({
                data: {
                    actor: current.id,
                    action: "admin.login",
                    target: current.id,
                    reason: "Administrator session created",
                    requestId,
                },
            });
            return {
                ...(await this.issue(tx, current.id, "admin")),
                admin: {
                    id: current.id,
                    username: current.username,
                    role: current.role,
                    entryIds: current.entryIds,
                },
            };
        });
    }
    async issue(tx, subjectId, domain) {
        const expiresIn = Number(this.config.get(`JWT_${domain.toUpperCase()}_EXPIRES_IN_SECONDS`, domain === "user" ? 86400 : 28800));
        const session = await tx.authSession.create({
            data: {
                subjectId,
                domain,
                expiresAt: new Date(Date.now() + expiresIn * 1000),
            },
        });
        const accessToken = await this.jwt.signAsync({ sub: subjectId, sid: session.id, tokenType: domain }, {
            secret: this.config.getOrThrow(`JWT_${domain.toUpperCase()}_SECRET`),
            expiresIn,
            algorithm: "HS256",
            issuer: this.config.get("APP_DOMAIN", "tck666.cc"),
            audience: `tck-wins-${domain}`,
        });
        return { accessToken, tokenType: "Bearer", expiresIn };
    }
    async me(actor) {
        if (actor.domain === "user")
            return {
                user: (0, views_1.userView)((0, errors_1.requireValue)(await this.db.user.findUnique({ where: { id: actor.id } }))),
            };
        const admin = (0, errors_1.requireValue)(await this.db.admin.findUnique({ where: { id: actor.id } }));
        return {
            admin: {
                id: admin.id,
                username: admin.username,
                role: admin.role,
                entryIds: admin.entryIds,
            },
        };
    }
    async logout(actor) {
        await this.db.authSession.updateMany({
            where: { id: actor.sessionId, subjectId: actor.id },
            data: { revokedAt: new Date() },
        });
        return { loggedOut: true };
    }
    async bind(tx, userId, ref, strict = true) {
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
        if (user.inviterId) {
            if (strict)
                (0, errors_1.fail)(409, "STATE_CONFLICT", "Invitation already bound");
            return;
        }
        const inviter = await tx.user.findUnique({
            where: { invitationCode: ref.trim().toUpperCase() },
        });
        if (!inviter || inviter.id === userId) {
            if (strict)
                (0, errors_1.fail)(422, "VALIDATION_ERROR", "Invalid invitation code");
            return;
        }
        let current = inviter.id;
        for (let depth = 0; current; depth++) {
            if (current === userId || depth > 100)
                (0, errors_1.fail)(409, "STATE_CONFLICT", "Invitation cycle is not allowed");
            current =
                (await tx.user.findUnique({
                    where: { id: current },
                    select: { inviterId: true },
                }))?.inviterId ?? null;
        }
        await tx.user.update({
            where: { id: userId },
            data: { inviterId: inviter.id },
        });
        await tx.invitation.create({
            data: { inviterId: inviter.id, inviteeId: userId },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        jwt_1.JwtService,
        ledger_service_1.LedgerService])
], AuthService);
//# sourceMappingURL=auth.service.js.map