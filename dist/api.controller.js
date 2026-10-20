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
exports.UserController = exports.PublicController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const guard_1 = require("./auth/guard");
const auth_service_1 = require("./auth/auth.service");
const prisma_service_1 = require("./prisma/prisma.service");
const query_service_1 = require("./queries/query.service");
const games_service_1 = require("./games/games.service");
const quests_service_1 = require("./quests/quests.service");
const dto_1 = require("./common/dto");
const errors_1 = require("./common/errors");
const views_1 = require("./common/views");
let PublicController = class PublicController {
    queries;
    db;
    constructor(queries, db) {
        this.queries = queries;
        this.db = db;
    }
    health() {
        return {
            status: "ok",
            service: "tck-wins-backend",
            time: new Date().toISOString(),
        };
    }
    async ready() {
        await this.db.$queryRaw `SELECT 1`;
        const worker = await this.db.workerHeartbeat.findFirst({
            where: { at: { gt: new Date(Date.now() - 30000) } },
        });
        const initialized = await this.db.setting.findUnique({
            where: { id: "global" },
        });
        if (!initialized || !worker)
            (0, errors_1.fail)(503, "NOT_READY", "Database seed or Worker is not ready");
        return { status: "ready", database: true, worker: true };
    }
    config() {
        return this.queries.publicConfig();
    }
    home() {
        return this.queries.home();
    }
    content() {
        return {
            siteName: "TCK Wins",
            siteUrl: "https://tck666.cc",
            source: "demo",
            communityLinks: [],
            announcement: "TCK Wins demo · No real funds",
        };
    }
    enums() {
        return {
            questTypes: ["daily", "game", "social"],
            gameKinds: ["coin_flip", "claw_machine", "cash_or_crash", "grid_run"],
            assets: ["SSC", "IP", "POINTS", "TICKET"],
            source: "demo",
        };
    }
    games(q) {
        return this.queries.games(q);
    }
    game(id) {
        return this.queries.game(id);
    }
    wins(q) {
        return this.queries.wins(q);
    }
    quests(r, q) {
        return this.queries.questList(r.actor?.id, q);
    }
    quest(r, id) {
        return this.queries.quest(r.actor?.id, id);
    }
    levels() {
        return this.queries.levels();
    }
    leaderboard(type, q) {
        return this.queries.leaderboard(type, q);
    }
    tournaments() {
        return { items: [], enabled: false, stage: "P1" };
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Get)("health"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "health", null);
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Get)("health/ready"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "ready", null);
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Get)("public/config"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "config", null);
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Get)("public/home-summary"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "home", null);
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Get)("public/site-content"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "content", null);
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Get)("public/enums"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "enums", null);
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Get)("games"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "games", null);
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Get)("games/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "game", null);
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Get)("live-wins"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "wins", null);
__decorate([
    (0, guard_1.Access)("optional"),
    (0, common_1.Get)("quests"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "quests", null);
__decorate([
    (0, guard_1.Access)("optional"),
    (0, common_1.Get)("quests/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "quest", null);
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Get)("membership/levels"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "levels", null);
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Get)("leaderboards/:type"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("type")),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "leaderboard", null);
__decorate([
    (0, guard_1.Access)("public"),
    (0, common_1.Get)(["tournaments", "tournaments/:id"]),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "tournaments", null);
exports.PublicController = PublicController = __decorate([
    (0, swagger_1.ApiTags)("Public"),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [query_service_1.QueryService,
        prisma_service_1.PrismaService])
], PublicController);
let UserController = class UserController {
    db;
    auth;
    queries;
    games;
    quests;
    constructor(db, auth, queries, games, quests) {
        this.db = db;
        this.auth = auth;
        this.queries = queries;
        this.games = games;
        this.quests = quests;
    }
    me(r) {
        return this.auth.me(r.actor);
    }
    dashboard(r) {
        return this.queries.dashboard(r.actor.id);
    }
    assets(r) {
        return this.queries.assets(r.actor.id);
    }
    ledger(r, q) {
        return this.queries.ledgerList(r.actor.id, q);
    }
    tickets(r, q) {
        return this.queries.ledgerList(r.actor.id, q, true);
    }
    sessions(r, q) {
        return this.queries.sessions(r.actor.id, q);
    }
    session(r, id) {
        return this.queries.session(r.actor.id, id);
    }
    fighters(r) {
        return this.queries.fighters(r.actor.id);
    }
    fighter(r, id) {
        return this.queries.fighter(r.actor.id, id);
    }
    fights(r, q) {
        return this.queries.fights(r.actor.id, q);
    }
    fight(r, id) {
        return this.queries.fight(r.actor.id, id);
    }
    rewards(r, q) {
        return this.queries.rewards(r.actor.id, q);
    }
    unread(r) {
        return this.queries.unread(r.actor.id);
    }
    notifications(r, q) {
        return this.queries.notifications(r.actor.id, q);
    }
    points(r, q) {
        return this.queries.pointLogs(r.actor.id, q);
    }
    records(r, q) {
        return this.queries.records(r.actor.id, q);
    }
    invites(r, q) {
        return this.queries.invitations(r.actor.id, q);
    }
    membership(r) {
        return this.queries.membership(r.actor.id);
    }
    holdings(r) {
        return this.queries.holdings(r.actor.id);
    }
    profile(dto, r, key) {
        return this.db.command(r.actor, "profile.update", key, dto, async (tx) => ({
            user: (0, views_1.userView)(await tx.user.update({
                where: { id: r.actor.id },
                data: { nickname: dto.nickname.trim() },
            })),
        }));
    }
    quote(id, dto, r, key) {
        return this.db.command(r.actor, `game.quote:${id}`, key, dto, (tx) => this.games.quote(tx, r.actor.id, id, dto.choice));
    }
    play(id, dto, r, key) {
        return this.db.command(r.actor, `game.play:${id}`, key, dto, (tx) => this.games.start(tx, r.actor.id, id, dto.quoteId));
    }
    actions() {
        (0, errors_1.fail)(409, "STATE_CONFLICT", "Coin Flip has no user actions after confirmation");
    }
    createFighter(dto, r, key) {
        return this.db.command(r.actor, "fighter.create", key, dto, (tx) => this.games.createFighter(tx, r.actor.id, dto));
    }
    retry(id, dto, r, key) {
        return this.db.command(r.actor, `fighter.retry:${id}`, key, dto, (tx) => this.games.createFighter(tx, r.actor.id, undefined, id));
    }
    fightQueue(dto, r, key) {
        return this.db.command(r.actor, "fight.queue", key, dto, (tx) => this.games.fight(tx, r.actor.id, dto.fighterId));
    }
    submit(id, dto, r, key) {
        return this.db.command(r.actor, `quest.submit:${id}`, key, dto, (tx) => this.quests.submit(tx, r.actor.id, id, dto.proof));
    }
    claimQuest(id, dto, r, key) {
        return this.db.command(r.actor, `quest.claim:${id}`, key, dto, (tx) => this.quests.claim(tx, r.actor.id, undefined, id));
    }
    claimReward(id, dto, r, key) {
        return this.db.command(r.actor, `reward.claim:${id}`, key, dto, (tx) => this.quests.claim(tx, r.actor.id, id));
    }
    read(id, dto, r, key) {
        return this.db.command(r.actor, `notification.read:${id}`, key, dto, async (tx) => {
            const n = (0, errors_1.requireValue)(await tx.notification.findFirst({
                where: { id, userId: r.actor.id },
            }));
            return {
                notification: await tx.notification.update({
                    where: { id },
                    data: { readAt: n.readAt ?? new Date() },
                }),
            };
        });
    }
    readAll(dto, r, key) {
        return this.db.command(r.actor, "notification.readAll", key, dto, async (tx) => {
            const result = await tx.notification.updateMany({
                where: { id: { in: dto.ids }, userId: r.actor.id, readAt: null },
                data: { readAt: new Date() },
            });
            return { read: true, count: result.count };
        });
    }
    bind(dto, r, key) {
        return this.db.command(r.actor, "invitation.bind", key, dto, async (tx) => {
            await this.auth.bind(tx, r.actor.id, dto.ref);
            return { bound: true };
        });
    }
    refreshHolding(dto, r, key) {
        return this.db.command(r.actor, "holdings.refresh", key, dto, async (tx) => {
            const s = await tx.holdingSnapshot.create({
                data: { userId: r.actor.id },
            });
            return { source: "demo", tckBalance: "0", syncedAt: s.createdAt };
        });
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)("users/me"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "me", null);
__decorate([
    (0, common_1.Get)("dashboard/me"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)("assets/me"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "assets", null);
__decorate([
    (0, common_1.Get)("assets/me/ledger"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "ledger", null);
__decorate([
    (0, common_1.Get)("tickets/me"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "tickets", null);
__decorate([
    (0, common_1.Get)("game-sessions/me"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "sessions", null);
__decorate([
    (0, common_1.Get)("game-sessions/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "session", null);
__decorate([
    (0, common_1.Get)("fighters/me"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "fighters", null);
__decorate([
    (0, common_1.Get)("fighters/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "fighter", null);
__decorate([
    (0, common_1.Get)("fights/me"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "fights", null);
__decorate([
    (0, common_1.Get)("fights/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "fight", null);
__decorate([
    (0, common_1.Get)("rewards/me"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "rewards", null);
__decorate([
    (0, common_1.Get)("notifications/unread-count"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "unread", null);
__decorate([
    (0, common_1.Get)("notifications"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "notifications", null);
__decorate([
    (0, common_1.Get)("users/me/point-logs"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "points", null);
__decorate([
    (0, common_1.Get)("users/me/quest-records"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "records", null);
__decorate([
    (0, common_1.Get)("invitations/me"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "invites", null);
__decorate([
    (0, common_1.Get)("membership/me"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "membership", null);
__decorate([
    (0, common_1.Get)("holdings/me"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "holdings", null);
__decorate([
    (0, common_1.Patch)("users/me"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ProfileDto, Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "profile", null);
__decorate([
    (0, common_1.Post)("games/:id/quotes"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.QuoteDto, Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "quote", null);
__decorate([
    (0, common_1.Post)("games/:id/sessions"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SessionDto, Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "play", null);
__decorate([
    (0, common_1.Post)("game-sessions/:id/actions"),
    openapi.ApiResponse({ status: 201 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UserController.prototype, "actions", null);
__decorate([
    (0, common_1.Post)("fighters"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.FighterDto, Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "createFighter", null);
__decorate([
    (0, common_1.Post)("fighters/:id/retry"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.EmptyDto, Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "retry", null);
__decorate([
    (0, common_1.Post)("fights/queue"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.FightDto, Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "fightQueue", null);
__decorate([
    (0, common_1.Post)("quests/:id/submit"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ProofDto, Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)("quests/:id/claim"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.EmptyDto, Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "claimQuest", null);
__decorate([
    (0, common_1.Post)("rewards/:id/claim"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.EmptyDto, Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "claimReward", null);
__decorate([
    (0, common_1.Patch)("notifications/:id/read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.EmptyDto, Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "read", null);
__decorate([
    (0, common_1.Post)("notifications/read-all"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ReadAllDto, Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "readAll", null);
__decorate([
    (0, common_1.Post)("invitations/bind"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.BindDto, Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "bind", null);
__decorate([
    (0, common_1.Post)("holdings/me/refresh"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.EmptyDto, Object, String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "refreshHolding", null);
exports.UserController = UserController = __decorate([
    (0, swagger_1.ApiTags)("User"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, guard_1.Access)("user"),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        query_service_1.QueryService,
        games_service_1.GamesService,
        quests_service_1.QuestsService])
], UserController);
//# sourceMappingURL=api.controller.js.map