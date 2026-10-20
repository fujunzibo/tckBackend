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
exports.WorkerService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const games_service_1 = require("../games/games.service");
const util_1 = require("../common/util");
let WorkerService = class WorkerService {
    db;
    games;
    id = (0, node_crypto_1.randomUUID)();
    logger = new common_1.Logger("Worker");
    constructor(db, games) {
        this.db = db;
        this.games = games;
    }
    async tick() {
        await this.db.workerHeartbeat.upsert({
            where: { id: this.id },
            create: { id: this.id, at: new Date() },
            update: { at: new Date() },
        });
        const jobs = await this.db.$queryRaw `UPDATE "Job" SET status = 'running', "leaseOwner" = ${this.id}, "leaseUntil" = now() + interval '30 seconds', attempt = attempt + 1 WHERE id IN (SELECT id FROM "Job" WHERE (status = 'pending' AND "runAt" <= now()) OR (status = 'running' AND "leaseUntil" < now()) ORDER BY "runAt", id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`;
        for (const job of jobs) {
            try {
                await this.db.serial(async (tx) => {
                    await this.db.lock(tx, `user:${job.userId}`);
                    const current = await tx.job.findUniqueOrThrow({
                        where: { id: job.id },
                    });
                    if (current.leaseOwner !== this.id || current.status !== "running")
                        return;
                    const exhausted = current.attempt > 5;
                    await this.games.finish(tx, job.type, job.entityId, job.businessKey, exhausted);
                    await tx.job.update({
                        where: { id: job.id },
                        data: {
                            status: exhausted ? "dead" : "completed",
                            leaseOwner: null,
                            leaseUntil: null,
                            lastError: exhausted ? "MAX_ATTEMPTS" : null,
                        },
                    });
                });
            }
            catch (error) {
                const code = error instanceof Error ? error.name : "JobError";
                this.logger.error(JSON.stringify({
                    jobId: job.id,
                    type: job.type,
                    attempt: job.attempt,
                    code,
                }));
                await this.db.serial(async (tx) => {
                    await this.db.lock(tx, `user:${job.userId}`);
                    const current = await tx.job.findUniqueOrThrow({
                        where: { id: job.id },
                    });
                    if (current.leaseOwner !== this.id || current.status !== "running")
                        return;
                    if (job.attempt >= 5)
                        await this.games.finish(tx, job.type, job.entityId, job.businessKey, true);
                    await tx.job.update({
                        where: { id: job.id },
                        data: {
                            status: job.attempt >= 5 ? "dead" : "pending",
                            runAt: new Date(Date.now() + 1000 * 2 ** Math.min(job.attempt, 6)),
                            leaseOwner: null,
                            leaseUntil: null,
                            lastError: code,
                        },
                    });
                });
            }
        }
        await this.publish();
        return jobs.length;
    }
    async publish() {
        return this.db.serial(async (tx) => {
            const events = await tx.$queryRaw `SELECT id FROM "Outbox" WHERE "publishedAt" IS NULL ORDER BY "createdAt", id FOR UPDATE SKIP LOCKED LIMIT 50`;
            for (const item of events) {
                const event = await tx.outbox.findUniqueOrThrow({
                    where: { id: item.id },
                });
                const payload = event.payload;
                await tx.notification.upsert({
                    where: { eventKey: event.eventKey },
                    create: {
                        userId: event.userId,
                        eventKey: event.eventKey,
                        type: event.type.split(".")[0],
                        title: payload.title,
                        body: (0, util_1.copy)("状态已更新，点击查看详情。", "Your activity has been updated. Open for details."),
                        href: payload.href,
                    },
                    update: {},
                });
                await tx.outbox.update({
                    where: { id: event.id },
                    data: { publishedAt: new Date() },
                });
            }
            return events.length;
        });
    }
};
exports.WorkerService = WorkerService;
exports.WorkerService = WorkerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        games_service_1.GamesService])
], WorkerService);
//# sourceMappingURL=worker.service.js.map