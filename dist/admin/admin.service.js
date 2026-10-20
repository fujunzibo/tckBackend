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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ledger_service_1 = require("../assets/ledger.service");
const quests_service_1 = require("../quests/quests.service");
const query_service_1 = require("../queries/query.service");
const errors_1 = require("../common/errors");
const util_1 = require("../common/util");
const views_1 = require("../common/views");
const pagination_1 = require("../common/pagination");
let AdminService = class AdminService {
    db;
    ledger;
    quests;
    queries;
    constructor(db, ledger, quests, queries) {
        this.db = db;
        this.ledger = ledger;
        this.quests = quests;
        this.queries = queries;
    }
    scope(actor) {
        return actor.role === "project_operator"
            ? { entryId: { in: actor.entryIds ?? [] } }
            : {};
    }
    checkScope(actor, entryId) {
        if (actor.role === "project_operator" && !actor.entryIds?.includes(entryId))
            (0, errors_1.fail)(403, "FORBIDDEN", "Entry is outside administrator scope");
    }
    async overview() {
        const [users, rounds, pending, issued] = await Promise.all([
            this.db.user.count(),
            this.db.gameSession.count(),
            this.db.questRecord.count({ where: { status: "pending_review" } }),
            this.db.reward.count({ where: { status: "issued" } }),
        ]);
        return { users, rounds, pending, issued };
    }
    async users(q) {
        const where = {
            status: q.status,
            level: q.level,
            ...(q.keyword
                ? {
                    OR: [
                        { id: { contains: q.keyword, mode: "insensitive" } },
                        { nickname: { contains: q.keyword, mode: "insensitive" } },
                    ],
                }
                : {}),
        };
        return (0, pagination_1.paged)(q, this.db.user
            .findMany({ where, ...(0, pagination_1.offset)(q), orderBy: [...pagination_1.newest] })
            .then((r) => r.map(views_1.userView)), this.db.user.count({ where }));
    }
    async user(id) {
        (0, errors_1.requireValue)(await this.db.user.findUnique({ where: { id } }));
        return {
            ...(await this.queries.dashboard(id)),
            records: await this.db.questRecord
                .findMany({ where: { userId: id }, take: 100, orderBy: [...pagination_1.newest] })
                .then((rows) => Promise.all(rows.map((r) => this.quests.record(this.db, r.id)))),
        };
    }
    async questList(actor, q) {
        const where = { ...this.scope(actor), status: q.status, type: q.type };
        return (0, pagination_1.paged)(q, this.db.quest
            .findMany({ where, ...(0, pagination_1.offset)(q), orderBy: [...pagination_1.newest] })
            .then((r) => r.map((x) => (0, views_1.questView)(x))), this.db.quest.count({ where }));
    }
    async recordList(actor, q) {
        const scope = actor.role === "project_operator"
            ? {
                questId: {
                    in: (await this.db.quest.findMany({
                        where: this.scope(actor),
                        select: { id: true },
                    })).map((x) => x.id),
                },
            }
            : {};
        const where = { ...scope, status: q.reviewStatus, userId: q.userId };
        return (0, pagination_1.paged)(q, this.db.questRecord
            .findMany({
            where,
            ...(0, pagination_1.offset)(q),
            orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
        })
            .then((rows) => Promise.all(rows.map((r) => this.quests.record(this.db, r.id)))), this.db.questRecord.count({ where }));
    }
    points(q) {
        const where = {
            assetId: "POINTS",
            userId: q.userId ?? { not: null },
            accountId: { startsWith: "user:" },
            reason: q.source,
        };
        return (0, pagination_1.paged)(q, this.db.ledgerEntry
            .findMany({ where, ...(0, pagination_1.offset)(q), orderBy: [...pagination_1.newest] })
            .then((r) => r.map(views_1.ledgerView)), this.db.ledgerEntry.count({ where }));
    }
    async settings() {
        const s = await this.db.setting.findUniqueOrThrow({
            where: { id: "global" },
        });
        return {
            version: s.version,
            maintenance: s.maintenance,
            gameCostAtomic: s.gameCostAtomic.toFixed(0),
            maxFighters: s.maxFighters,
        };
    }
    async resources(kind, actor, q) {
        const opts = { ...(0, pagination_1.offset)(q), orderBy: [...pagination_1.newest] };
        switch (kind) {
            case "games": {
                const where = actor.role === "project_operator"
                    ? { entryId: { in: actor.entryIds ?? [] } }
                    : {};
                return (0, pagination_1.paged)(q, this.db.game
                    .findMany({ where, ...(0, pagination_1.offset)(q), orderBy: { id: "asc" } })
                    .then((r) => r.map(views_1.gameView)), this.db.game.count({ where }));
            }
            case "game-sessions":
                return (0, pagination_1.paged)(q, this.db.gameSession
                    .findMany({ ...opts })
                    .then((r) => r.map(views_1.sessionView)), this.db.gameSession.count());
            case "fighters":
                return (0, pagination_1.paged)(q, this.db.fighter.findMany(opts).then((r) => r.map(views_1.fighterView)), this.db.fighter.count());
            case "fights":
                return (0, pagination_1.paged)(q, this.db.fight.findMany(opts).then((r) => r.map(views_1.fightView)), this.db.fight.count());
            case "rewards/batches":
                return (0, pagination_1.paged)(q, this.db.reward.findMany(opts).then((r) => r.map(views_1.rewardView)), this.db.reward.count());
            case "audit-logs":
                return (0, pagination_1.paged)(q, this.db.auditLog.findMany(opts), this.db.auditLog.count());
            case "invitations":
                return (0, pagination_1.paged)(q, this.db.user.findMany({
                    ...opts,
                    where: { inviterId: { not: null } },
                    select: {
                        id: true,
                        nickname: true,
                        inviterId: true,
                        createdAt: true,
                    },
                }), this.db.invitation.count());
            case "import-batches":
                return (0, pagination_1.paged)(q, this.db.importBatch.findMany(opts), this.db.importBatch.count());
            case "legacy-identities":
                return (0, pagination_1.paged)(q, this.db.legacyIdentityLink.findMany(opts), this.db.legacyIdentityLink.count());
            case "jobs":
                return (0, pagination_1.paged)(q, this.db.job.findMany({ ...opts, where: { status: q.status } }), this.db.job.count({ where: { status: q.status } }));
            case "outbox":
                return (0, pagination_1.paged)(q, this.db.outbox.findMany(opts), this.db.outbox.count());
            default:
                return {
                    ...(await (0, pagination_1.paged)(q, Promise.resolve([]), Promise.resolve(0))),
                    enabled: false,
                    stage: kind.startsWith("noova") ? "P2" : "P1",
                };
        }
    }
    async audit(tx, actor, action, target, reason, requestId) {
        await tx.auditLog.create({
            data: { actor: actor.id, action, target, reason, requestId },
        });
    }
    async adjust(tx, dto) {
        (0, errors_1.requireValue)(await tx.user.findUnique({ where: { id: dto.userId } }));
        const amount = (0, util_1.atomic)(dto.changeAmount, true, 1000000n);
        if (amount === 0n)
            (0, errors_1.fail)(422, "AMOUNT_OUT_OF_RANGE", "Adjustment cannot be zero");
        const from = amount > 0n ? (0, ledger_service_1.treasury)("POINTS") : (0, ledger_service_1.wallet)(dto.userId, "POINTS"), to = amount > 0n ? (0, ledger_service_1.wallet)(dto.userId, "POINTS") : (0, ledger_service_1.treasury)("POINTS");
        const referenceId = crypto.randomUUID();
        await this.ledger.transfer(tx, `adjust:${referenceId}`, "POINTS", from, to, amount < 0n ? -amount : amount, "admin_adjustment", referenceId);
        return {
            user: (0, views_1.userView)(await tx.user.findUniqueOrThrow({ where: { id: dto.userId } })),
            reason: dto.reason,
        };
    }
    async editQuest(tx, actor, dto, id) {
        const old = id
            ? (0, errors_1.requireValue)(await tx.quest.findUnique({ where: { id } }))
            : undefined;
        if (old) {
            this.checkScope(actor, old.entryId);
            if (dto.version !== old.version)
                (0, errors_1.fail)(409, "VERSION_CONFLICT", "Quest has changed");
        }
        const entryId = dto.entryId ?? old?.entryId ?? "tck-originals";
        this.checkScope(actor, entryId);
        const amount = (0, util_1.atomic)(dto.rewardAmount, false, 1000000n);
        if (amount < 1n || new Date(dto.endTime) <= new Date(dto.startTime))
            (0, errors_1.fail)(422, "VALIDATION_ERROR", "Invalid reward or quest dates");
        if (old &&
            old.type !== dto.type &&
            (await tx.questRecord.count({ where: { questId: old.id } })))
            (0, errors_1.fail)(409, "STATE_CONFLICT", "Cannot change the period of a quest with submissions");
        const previousTitle = old?.title, previousDescription = old?.description;
        const data = {
            title: {
                ...(previousTitle ?? (0, util_1.copy)(dto.title.trim())),
                zh: dto.title.trim(),
            },
            description: {
                ...(previousDescription ?? (0, util_1.copy)(dto.description.trim())),
                zh: dto.description.trim(),
            },
            type: dto.type,
            reviewMode: dto.reviewMode,
            status: dto.status,
            rewardAmount: dto.rewardAmount,
            startTime: new Date(dto.startTime),
            endTime: new Date(dto.endTime),
            entryId,
        };
        const quest = old
            ? await tx.quest.update({
                where: { id: old.id },
                data: { ...data, version: { increment: 1 } },
            })
            : await tx.quest.create({ data });
        if (!old)
            await this.ledger.account(tx, (0, ledger_service_1.budget)(quest.id), "POINTS", "budget");
        return { quest: (0, views_1.questView)(quest) };
    }
    async questStatus(tx, actor, id, dto) {
        const q = (0, errors_1.requireValue)(await tx.quest.findUnique({ where: { id } }));
        this.checkScope(actor, q.entryId);
        if (q.version !== dto.version)
            (0, errors_1.fail)(409, "VERSION_CONFLICT", "Quest has changed");
        return {
            quest: (0, views_1.questView)(await tx.quest.update({
                where: { id },
                data: { status: dto.status, version: { increment: 1 } },
            })),
        };
    }
    async addBudget(tx, id, dto) {
        (0, errors_1.requireValue)(await tx.quest.findUnique({ where: { id } }));
        await this.ledger.transfer(tx, `budget:topup:${crypto.randomUUID()}`, "POINTS", (0, ledger_service_1.treasury)("POINTS"), (0, ledger_service_1.budget)(id), (0, util_1.atomic)(dto.amountAtomic, false, 1000000000000n), "quest_budget", id);
        return {
            questId: id,
            availableAtomic: (await tx.account.findUniqueOrThrow({ where: { id: (0, ledger_service_1.budget)(id) } })).balance.toFixed(0),
        };
    }
    async getBudget(actor, id) {
        const quest = (0, errors_1.requireValue)(await this.db.quest.findUnique({ where: { id } }));
        this.checkScope(actor, quest.entryId);
        return {
            questId: id,
            availableAtomic: (await this.db.account.findUniqueOrThrow({ where: { id: (0, ledger_service_1.budget)(id) } })).balance.toFixed(0),
            assetId: "POINTS",
        };
    }
    async saveSettings(tx, actor, dto) {
        const amount = (0, util_1.atomic)(dto.gameCostAtomic, false, 1000n);
        if (amount < 1n)
            (0, errors_1.fail)(422, "AMOUNT_OUT_OF_RANGE", "Invalid game cost");
        const changed = await tx.setting.updateMany({
            where: { id: "global", version: dto.version },
            data: {
                version: { increment: 1 },
                maintenance: dto.maintenance,
                gameCostAtomic: dto.gameCostAtomic,
                maxFighters: dto.maxFighters,
            },
        });
        if (!changed.count)
            (0, errors_1.fail)(409, "VERSION_CONFLICT", "Settings have changed");
        const game = await tx.game.update({
            where: { id: "game_coin_flip" },
            data: { costAtomic: dto.gameCostAtomic, version: { increment: 1 } },
        });
        await tx.gameRule.create({
            data: {
                gameId: game.id,
                version: game.version,
                amountAtomic: game.costAtomic,
            },
        });
        const result = { ...dto, version: dto.version + 1 };
        await tx.configVersion.create({
            data: { version: result.version, actorId: actor.id, value: (0, util_1.json)(result) },
        });
        return result;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        quests_service_1.QuestsService,
        query_service_1.QueryService])
], AdminService);
//# sourceMappingURL=admin.service.js.map