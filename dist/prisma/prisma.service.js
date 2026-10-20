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
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const errors_1 = require("../common/errors");
const util_1 = require("../common/util");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor(config) {
        super({
            adapter: new adapter_pg_1.PrismaPg({
                connectionString: config.getOrThrow("DATABASE_URL"),
                max: Number(config.get("DATABASE_POOL_MAX", 10)),
                connectionTimeoutMillis: Number(config.get("DATABASE_CONNECT_TIMEOUT_MS", 5000)),
            }),
        });
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    async serial(work) {
        for (let attempt = 0;; attempt++) {
            try {
                return await this.$transaction(work, {
                    isolationLevel: "Serializable",
                    maxWait: 10000,
                    timeout: 15000,
                });
            }
            catch (error) {
                const code = error.code;
                if (!["P2034", "P2002", "40001", "40P01"].includes(code ?? "") ||
                    attempt >= 5)
                    throw error;
                await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 20));
            }
        }
    }
    async lock(tx, key) {
        await tx.$queryRaw `SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`;
    }
    async assertActor(tx, actor) {
        const session = await tx.authSession.findUnique({
            where: { id: actor.sessionId },
        });
        if (!session ||
            session.revokedAt ||
            session.expiresAt <= new Date() ||
            session.subjectId !== actor.id ||
            session.domain !== actor.domain)
            (0, errors_1.fail)(401, "SESSION_REVOKED", "Please sign in again");
        if (actor.domain === "user") {
            const user = await tx.user.findUnique({ where: { id: actor.id } });
            if (!user || user.status !== "normal")
                (0, errors_1.fail)(403, "USER_FROZEN", "Account is unavailable");
        }
        else {
            const admin = await tx.admin.findUnique({ where: { id: actor.id } });
            if (!admin?.enabled ||
                admin.role !== actor.role ||
                (0, util_1.canonical)(admin.entryIds) !== (0, util_1.canonical)(actor.entryIds))
                (0, errors_1.fail)(403, "FORBIDDEN", "Administrator permissions have changed");
        }
    }
    async command(actor, operation, key, body, work) {
        if (!key || !/^[a-zA-Z0-9:_-]{8,128}$/.test(key))
            (0, errors_1.fail)(422, "IDEMPOTENCY_KEY_REQUIRED", "Supply a valid Idempotency-Key");
        const subject = `${actor.domain}:${actor.id}`, requestHash = (0, util_1.hash)((0, util_1.canonical)(body));
        return this.serial(async (tx) => {
            await this.lock(tx, subject);
            await this.assertActor(tx, actor);
            const previous = await tx.idempotency.findUnique({
                where: { subject_operation_key: { subject, operation, key } },
            });
            if (previous) {
                if (previous.hash !== requestHash)
                    (0, errors_1.fail)(409, "IDEMPOTENCY_CONFLICT", "This key was already used with different input");
                return previous.response;
            }
            const response = await work(tx);
            await tx.idempotency.create({
                data: {
                    subject,
                    operation,
                    key,
                    hash: requestHash,
                    response: (0, util_1.json)(response),
                },
            });
            return response;
        });
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map