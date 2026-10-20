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
exports.QueryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const ledger_service_1 = require("../assets/ledger.service");
const quests_service_1 = require("../quests/quests.service");
const pagination_1 = require("../common/pagination");
const errors_1 = require("../common/errors");
const views_1 = require("../common/views");
const util_1 = require("../common/util");
const public_presentation_1 = require("../public-presentation");
let QueryService = class QueryService {
    db;
    ledger;
    quests;
    cursors;
    constructor(db, ledger, quests, cursors) {
        this.db = db;
        this.ledger = ledger;
        this.quests = quests;
        this.cursors = cursors;
    }
    async publicConfig() {
        return {
            ...(0, public_presentation_1.publicPresentation)(await this.db.game.findMany({ orderBy: { id: "asc" } })),
            features: {
                demoLogin: true,
                fighterFailureSimulation: true,
                rewardBudgets: true,
                payments: false,
                tournaments: false,
                noova: false,
            },
            assets: await this.db.asset.findMany(),
            apiVersion: "0.1.0",
        };
    }
    async home() {
        const [games, rounds, fighters, members] = await Promise.all([
            this.db.game.count(),
            this.db.gameSession.count({ where: { status: "settled" } }),
            this.db.fighter.count({ where: { status: "ready" } }),
            this.db.user.count({ where: { actorType: "player", status: "normal" } }),
        ]);
        return { games, rounds, fighters, members, source: "demo" };
    }
    async games(q) {
        const where = {
            slug: q.slug,
            kind: q.gameKind ?? q.kind,
            chainId: q.chainId,
            assetId: q.assetId,
            entryId: q.entryId,
            mode: q.mode,
            status: q.status,
        };
        return (0, pagination_1.paged)(q, this.db.game
            .findMany({ where, ...(0, pagination_1.offset)(q), orderBy: { id: "asc" } })
            .then((rows) => rows.map(views_1.gameView)), this.db.game.count({ where }));
    }
    async game(id) {
        return {
            game: (0, views_1.gameView)((0, errors_1.requireValue)(await this.db.game.findUnique({ where: { id } }))),
        };
    }
    async wins(q) {
        const rows = await this.db.liveWin.findMany({
            where: this.cursors.after(q, "live-wins"),
            orderBy: [...pagination_1.newest],
            take: q.pageSize + 1,
        });
        return this.cursors.result(rows, q, "live-wins", (row) => ({
            ...row,
            payoutAtomic: row.payoutAtomic.toFixed(0),
        }));
    }
    async dashboard(userId) {
        const [user, assets, sessions, fighters, unread, completedQuests, claimable,] = await Promise.all([
            this.db.user.findUniqueOrThrow({ where: { id: userId } }),
            this.ledger.assets(this.db, userId),
            this.db.gameSession.findMany({
                where: { userId },
                orderBy: [...pagination_1.newest],
                take: 4,
            }),
            this.db.fighter.findMany({
                where: { userId },
                orderBy: [...pagination_1.newest],
                take: 100,
            }),
            this.db.notification.count({ where: { userId, readAt: null } }),
            this.db.questRecord.count({
                where: { userId, status: { in: ["completed", "reward_claimed"] } },
            }),
            this.db.reward.count({ where: { userId, status: "eligible" } }),
        ]);
        return {
            user: (0, views_1.userView)(user),
            assets,
            sessions: sessions.map(views_1.sessionView),
            fighters: fighters.map(views_1.fighterView),
            unread,
            completedQuests,
            claimable,
        };
    }
    async assets(userId) {
        return { items: await this.ledger.assets(this.db, userId) };
    }
    async ledgerList(userId, q, tickets = false) {
        const scope = `ledger:${userId}:${tickets}`;
        const assetId = tickets ? "TICKET" : q.assetId;
        const accounts = await this.db.account.findMany({
            where: { userId, kind: "available" },
            select: { id: true },
        });
        const rows = await this.db.ledgerEntry.findMany({
            where: {
                AND: [
                    { userId, accountId: { in: accounts.map((a) => a.id) }, assetId },
                    this.cursors.after(q, scope),
                ],
            },
            orderBy: [...pagination_1.newest],
            take: q.pageSize + 1,
        });
        const result = this.cursors.result(rows, q, scope, views_1.ledgerView);
        if (!tickets)
            return result;
        return {
            ...result,
            balance: (await this.ledger.assets(this.db, userId)).find((a) => a.assetId === "TICKET"),
            lots: await this.db.ticketLot.findMany({
                where: { userId },
                orderBy: [...pagination_1.newest],
                take: 100,
            }),
        };
    }
    async sessions(userId, q) {
        const scope = `sessions:${userId}`;
        return this.cursors.result(await this.db.gameSession.findMany({
            where: {
                AND: [{ userId, status: q.status }, this.cursors.after(q, scope)],
            },
            orderBy: [...pagination_1.newest],
            take: q.pageSize + 1,
        }), q, scope, views_1.sessionView);
    }
    async session(userId, id) {
        return {
            session: (0, views_1.sessionView)((0, errors_1.requireValue)(await this.db.gameSession.findFirst({ where: { id, userId } }))),
        };
    }
    async fighters(userId) {
        return {
            items: (await this.db.fighter.findMany({
                where: { userId },
                orderBy: [...pagination_1.newest],
                take: 100,
            })).map(views_1.fighterView),
            limit: (await this.db.setting.findUniqueOrThrow({ where: { id: "global" } })).maxFighters,
        };
    }
    async fighter(userId, id) {
        return {
            fighter: (0, views_1.fighterView)((0, errors_1.requireValue)(await this.db.fighter.findFirst({ where: { id, userId } }))),
        };
    }
    async fights(userId, q) {
        const scope = `fights:${userId}`;
        return this.cursors.result(await this.db.fight.findMany({
            where: {
                AND: [{ userId, status: q.status }, this.cursors.after(q, scope)],
            },
            orderBy: [...pagination_1.newest],
            take: q.pageSize + 1,
        }), q, scope, views_1.fightView);
    }
    async fight(userId, id) {
        return {
            fight: (0, views_1.fightView)((0, errors_1.requireValue)(await this.db.fight.findFirst({ where: { id, userId } }))),
        };
    }
    async questList(userId, q) {
        const join = client_1.Prisma.sql `FROM "Quest" q LEFT JOIN "QuestRecord" r ON r."questId" = q.id AND r."userId" = ${userId ?? ""} AND r."periodKey" = CASE WHEN q.type = 'daily' THEN ${(0, util_1.period)("daily")} ELSE 'once' END WHERE q.status = 'published' AND (${q.type ?? ""} = '' OR q.type = ${q.type ?? ""}) AND (${q.status ?? ""} = '' OR COALESCE(r.status, 'not_started') = ${q.status ?? ""})`;
        const [rows, counts] = await Promise.all([
            this.db.$queryRaw(client_1.Prisma.sql `SELECT q.*, COALESCE(r.status, 'not_started') AS "userStatus" ${join} ORDER BY q."createdAt" DESC, q.id DESC LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`),
            this.db.$queryRaw(client_1.Prisma.sql `SELECT COUNT(*) AS count ${join}`),
        ]);
        return (0, pagination_1.paged)(q, Promise.resolve(rows.map((row) => (0, views_1.questView)(row, row.userStatus))), Promise.resolve(Number(counts[0].count)));
    }
    async quest(userId, id) {
        const quest = (0, errors_1.requireValue)(await this.db.quest.findFirst({ where: { id, status: "published" } }));
        const r = userId
            ? await this.db.questRecord.findUnique({
                where: {
                    userId_questId_periodKey: {
                        userId,
                        questId: id,
                        periodKey: (0, util_1.period)(quest.type),
                    },
                },
            })
            : null;
        return {
            quest: (0, views_1.questView)(quest, r?.status),
            record: r ? await this.quests.record(this.db, r.id) : null,
        };
    }
    rewards(userId, q) {
        const where = { userId, status: q.status };
        return (0, pagination_1.paged)(q, this.db.reward
            .findMany({ where, orderBy: [...pagination_1.newest], ...(0, pagination_1.offset)(q) })
            .then((r) => r.map(views_1.rewardView)), this.db.reward.count({ where }));
    }
    async notifications(userId, q) {
        const scope = `notifications:${userId}`, where = {
            userId,
            type: q.type,
            ...(q.unread === "true" ? { readAt: null } : {}),
        };
        const [rows, snapshot] = await Promise.all([
            this.db.notification.findMany({
                where: { AND: [where, this.cursors.after(q, scope)] },
                orderBy: [...pagination_1.newest],
                take: q.pageSize + 1,
            }),
            this.db.notification.findMany({
                where: { userId, readAt: null },
                select: { id: true },
                take: 1000,
                orderBy: [...pagination_1.newest],
            }),
        ]);
        return {
            ...this.cursors.result(rows, q, scope, (r) => r),
            snapshotIds: snapshot.map((r) => r.id),
        };
    }
    async unread(userId) {
        return {
            count: await this.db.notification.count({
                where: { userId, readAt: null },
            }),
        };
    }
    pointLogs(userId, q) {
        const where = { userId, accountId: (0, ledger_service_1.wallet)(userId, "POINTS") };
        return (0, pagination_1.paged)(q, this.db.ledgerEntry
            .findMany({ where, ...(0, pagination_1.offset)(q), orderBy: [...pagination_1.newest] })
            .then((r) => r.map(views_1.ledgerView)), this.db.ledgerEntry.count({ where }));
    }
    records(userId, q) {
        return (0, pagination_1.paged)(q, this.db.questRecord
            .findMany({ where: { userId }, ...(0, pagination_1.offset)(q), orderBy: [...pagination_1.newest] })
            .then((r) => r.map(views_1.recordView)), this.db.questRecord.count({ where: { userId } }));
    }
    async invitations(userId, q) {
        const user = await this.db.user.findUniqueOrThrow({
            where: { id: userId },
        });
        const [result, effectiveInvited] = await Promise.all([
            (0, pagination_1.paged)(q, this.db.user.findMany({
                where: { inviterId: userId },
                ...(0, pagination_1.offset)(q),
                orderBy: [...pagination_1.newest],
                select: { id: true, nickname: true, createdAt: true },
            }), this.db.invitation.count({ where: { inviterId: userId } })),
            this.db.invitation.count({
                where: { inviterId: userId, effectiveAt: { not: null } },
            }),
        ]);
        return {
            ...result,
            totalInvited: result.pagination.total,
            effectiveInvited,
            invitationUrl: `https://tck666.cc/?ref=${user.invitationCode}`,
        };
    }
    async leaderboard(type, q) {
        if (!["points", "quests", "invitations"].includes(type))
            (0, errors_1.fail)(422, "VALIDATION_ERROR", "Unknown leaderboard");
        const value = type === "points"
            ? client_1.Prisma.sql `u.points`
            : type === "quests"
                ? client_1.Prisma.sql `(SELECT COUNT(*) FROM "QuestRecord" r WHERE r."userId"=u.id AND r.status IN ('completed','reward_claimed'))`
                : client_1.Prisma.sql `(SELECT COUNT(*) FROM "Invitation" i WHERE i."inviterId"=u.id AND i."effectiveAt" IS NOT NULL)`;
        const rows = await this.db.$queryRaw(client_1.Prisma.sql `SELECT id,nickname,level, value::text, ROW_NUMBER() OVER (ORDER BY value DESC,id) AS rank FROM (SELECT u.id,u.nickname,u.level, ${value} AS value FROM "User" u WHERE u.status='normal' AND u."actorType"='player') ranked ORDER BY ranked.value DESC,id LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`);
        return {
            ...(await (0, pagination_1.paged)(q, Promise.resolve(rows.map((r) => ({ ...r, rank: Number(r.rank) }))), this.db.user.count({
                where: { status: "normal", actorType: "player" },
            }))),
            source: "demo",
            period: "all-time",
        };
    }
    levels() {
        return {
            items: [
                { level: "Bronze", points: "0" },
                { level: "Silver", points: "1000" },
                { level: "Gold", points: "5000" },
                { level: "Platinum", points: "20000" },
                { level: "Genesis", points: null },
            ],
        };
    }
    async membership(userId) {
        const u = await this.db.user.findUniqueOrThrow({ where: { id: userId } });
        return {
            level: u.level,
            pointsExact: u.points.toFixed(0),
            tckBalance: "0",
            source: "demo",
        };
    }
    async holdings(userId) {
        const latest = await this.db.holdingSnapshot.findFirst({
            where: { userId },
            orderBy: [...pagination_1.newest],
        });
        return {
            balance: latest?.balance.toFixed(0) ?? "0",
            tckBalance: latest?.balance.toFixed(0) ?? "0",
            source: "demo",
            syncedAt: latest?.createdAt ?? null,
            items: latest ? [{ ...latest, balance: latest.balance.toFixed(0) }] : [],
        };
    }
};
exports.QueryService = QueryService;
exports.QueryService = QueryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        quests_service_1.QuestsService,
        pagination_1.Cursors])
], QueryService);
//# sourceMappingURL=query.service.js.map