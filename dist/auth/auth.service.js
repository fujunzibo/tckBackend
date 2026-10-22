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
const viem_1 = require("viem");
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
    async walletNonce(dto, ip, originHeader, refererHeader) {
        await this.throttle(ip, "wallet-nonce", 30);
        const walletAddress = this.walletAddress(dto.walletAddress);
        const nonce = (0, util_1.secret)();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        const { domain, uri } = this.signInSite(originHeader, refererHeader);
        const message = [
            `${domain} wants you to sign in with your Ethereum account:`,
            walletAddress,
            "",
            "Sign in to TCK Wins. This request does not trigger a transaction or cost gas.",
            "",
            `URI: ${uri}`,
            "Version: 1",
            `Chain ID: ${dto.chainId}`,
            `Nonce: ${nonce}`,
            `Issued At: ${new Date().toISOString()}`,
            `Expiration Time: ${expiresAt.toISOString()}`,
        ].join("\n");
        await this.db.walletChallenge.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
        await this.db.walletChallenge.create({
            data: {
                nonce,
                walletAddress,
                chainId: dto.chainId,
                message,
                expiresAt,
            },
        });
        return { nonce, message, expiresAt: expiresAt.toISOString() };
    }
    async walletLogin(dto, ip) {
        await this.throttle(ip, "wallet-login", 20);
        const walletAddress = this.walletAddress(dto.walletAddress);
        return this.db.serial(async (tx) => {
            await this.db.lock(tx, `wallet-login:${walletAddress.toLowerCase()}`);
            const challenge = await tx.walletChallenge.findUnique({
                where: { nonce: dto.nonce },
            });
            if (!challenge ||
                challenge.consumedAt ||
                challenge.expiresAt <= new Date() ||
                challenge.walletAddress !== walletAddress)
                (0, errors_1.fail)(401, "UNAUTHORIZED", "Sign-in challenge expired");
            let valid = false;
            try {
                valid = await (0, viem_1.verifyMessage)({
                    address: walletAddress,
                    message: challenge.message,
                    signature: dto.signature,
                });
            }
            catch {
                valid = false;
            }
            if (!valid)
                (0, errors_1.fail)(401, "UNAUTHORIZED", "Wallet signature is invalid");
            const consumed = await tx.walletChallenge.updateMany({
                where: { nonce: dto.nonce, consumedAt: null },
                data: { consumedAt: new Date() },
            });
            if (consumed.count !== 1)
                (0, errors_1.fail)(401, "UNAUTHORIZED", "Sign-in challenge expired");
            let user = await tx.user.findUnique({ where: { walletAddress } });
            if (!user) {
                user = await tx.user.create({
                    data: {
                        nickname: `${walletAddress.slice(0, 6)}-${walletAddress.slice(-4)}`,
                        walletAddress,
                        invitationCode: (0, util_1.secret)().slice(0, 12).toUpperCase(),
                    },
                });
                await tx.identity.create({
                    data: {
                        provider: "wallet",
                        subject: walletAddress.toLowerCase(),
                        userId: user.id,
                    },
                });
                await this.ledger.signup(tx, user.id);
                if (dto.ref)
                    await this.bind(tx, user.id, dto.ref, false);
                user = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
            }
            if (user.status !== "normal")
                (0, errors_1.fail)(403, "USER_FROZEN", "Account is unavailable");
            return {
                ...(await this.issue(tx, user.id, "user")),
                user: (0, views_1.userView)(user),
            };
        });
    }
    signInSite(originHeader, refererHeader) {
        const allowed = this.config
            .get("APP_ORIGIN", "http://127.0.0.1:3001")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        const origin = this.callerOrigin(originHeader, refererHeader);
        if (!origin || !allowed.includes(origin))
            (0, errors_1.fail)(422, "VALIDATION_ERROR", "Sign-in origin is not allowed");
        const url = new URL(origin);
        if (url.origin !== origin || !["http:", "https:"].includes(url.protocol))
            (0, errors_1.fail)(422, "VALIDATION_ERROR", "Sign-in origin is not allowed");
        return { domain: url.host, uri: url.origin };
    }
    callerOrigin(originHeader, refererHeader) {
        const origin = originHeader?.trim();
        if (origin)
            return origin;
        if (!refererHeader)
            return;
        try {
            return new URL(refererHeader).origin;
        }
        catch {
            return;
        }
    }
    walletAddress(value) {
        if (!(0, viem_1.isAddress)(value))
            (0, errors_1.fail)(422, "VALIDATION_ERROR", "Invalid wallet address");
        return (0, viem_1.getAddress)(value);
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