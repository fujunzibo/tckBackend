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
exports.AdminController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const guard_1 = require("../auth/guard");
const prisma_service_1 = require("../prisma/prisma.service");
const quests_service_1 = require("../quests/quests.service");
const query_service_1 = require("../queries/query.service");
const admin_service_1 = require("./admin.service");
const dto_1 = require("../common/dto");
const errors_1 = require("../common/errors");
const views_1 = require("../common/views");
let AdminController = class AdminController {
    db;
    admin;
    quests;
    queries;
    constructor(db, admin, quests, queries) {
        this.db = db;
        this.admin = admin;
        this.quests = quests;
        this.queries = queries;
    }
    write(r, key, dto, target, reason, work) {
        const action = `${r.method} ${r.path}`;
        return this.db.command(r.actor, action, key, dto, async (tx) => {
            const result = await work(tx);
            await this.admin.audit(tx, r.actor, action, target, reason, r.requestId);
            return result;
        });
    }
    overview() {
        return this.admin.overview();
    }
    users(q) {
        return this.admin.users(q);
    }
    user(id) {
        return this.admin.user(id);
    }
    questsList(r, q) {
        return this.admin.questList(r.actor, q);
    }
    records(r, q) {
        return this.admin.recordList(r.actor, q);
    }
    getBudget(id, r) {
        return this.admin.getBudget(r.actor, id);
    }
    templates() {
        return {
            items: [
                { id: "daily", type: "daily", reviewMode: "auto" },
                { id: "game", type: "game", reviewMode: "manual" },
                { id: "social", type: "social", reviewMode: "manual" },
            ],
        };
    }
    points(q) {
        return this.admin.points(q);
    }
    settings() {
        return this.admin.settings();
    }
    games(r, q) {
        return this.admin.resources("games", r.actor, q);
    }
    activity(r, q) {
        return this.admin.resources(r.path.split("/").at(-1), r.actor, q);
    }
    rewards(r, q) {
        return this.admin.resources("rewards/batches", r.actor, q);
    }
    audit(r, q) {
        return this.admin.resources("audit-logs", r.actor, q);
    }
    invitations(r, q) {
        return this.admin.resources("invitations", r.actor, q);
    }
    leaderboard(q) {
        return this.queries.leaderboard(q.type ?? "points", q);
    }
    legacy(r, q) {
        return this.admin.resources(r.path.split("/").at(-1), r.actor, q);
    }
    jobs(r, q) {
        return this.admin.resources(r.path.split("/").at(-1), r.actor, q);
    }
    disabled(r, q) {
        return this.admin.resources(r.path.replace(/^.*\/admin\//, ""), r.actor, q);
    }
    create(dto, r, key) {
        return this.write(r, key, dto, "new quest", "Create quest", (tx) => this.admin.editQuest(tx, r.actor, dto));
    }
    edit(id, dto, r, key) {
        return this.write(r, key, dto, id, "Edit quest", (tx) => this.admin.editQuest(tx, r.actor, dto, id));
    }
    status(id, dto, r, key) {
        return this.write(r, key, dto, id, "Change quest status", (tx) => this.admin.questStatus(tx, r.actor, id, dto));
    }
    review(id, dto, r, key) {
        return this.write(r, key, dto, id, dto.reason ?? dto.action, (tx) => this.quests.review(tx, r.actor, id, dto));
    }
    adjust(dto, r, key) {
        return this.write(r, key, dto, dto.userId, dto.reason, (tx) => this.admin.adjust(tx, dto));
    }
    budget(id, dto, r, key) {
        return this.write(r, key, dto, id, dto.reason, (tx) => this.admin.addBudget(tx, id, dto));
    }
    settingsUpdate(dto, r, key) {
        return this.write(r, key, dto, "global", "Update configuration version", (tx) => this.admin.saveSettings(tx, r.actor, dto));
    }
    freeze(id, dto, r, key) {
        return this.write(r, key, dto, id, dto.reason, async (tx) => {
            (0, errors_1.requireValue)(await tx.user.findUnique({ where: { id } }));
            const user = await tx.user.update({
                where: { id },
                data: { status: dto.status },
            });
            if (dto.status === "frozen")
                await tx.authSession.updateMany({
                    where: { subjectId: id, domain: "user", revokedAt: null },
                    data: { revokedAt: new Date() },
                });
            return { user: (0, views_1.userView)(user) };
        });
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, guard_1.Access)("admin", "overview.read"),
    (0, common_1.Get)("overview"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "overview", null);
__decorate([
    (0, guard_1.Access)("admin", "users.read"),
    (0, common_1.Get)("users"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "users", null);
__decorate([
    (0, guard_1.Access)("admin", "users.read"),
    (0, common_1.Get)("users/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "user", null);
__decorate([
    (0, guard_1.Access)("admin", "quests.read"),
    (0, common_1.Get)("quests"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "questsList", null);
__decorate([
    (0, guard_1.Access)("admin", "quests.read"),
    (0, common_1.Get)("quest-records"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "records", null);
__decorate([
    (0, guard_1.Access)("admin", "quests.read"),
    (0, common_1.Get)("quests/:id/budget"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getBudget", null);
__decorate([
    (0, guard_1.Access)("admin", "quests.read"),
    (0, common_1.Get)("quest-templates"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "templates", null);
__decorate([
    (0, guard_1.Access)("admin", "ledger.read"),
    (0, common_1.Get)("points/logs"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "points", null);
__decorate([
    (0, guard_1.Access)("admin", "settings.read"),
    (0, common_1.Get)("settings"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "settings", null);
__decorate([
    (0, guard_1.Access)("admin", "catalog.read"),
    (0, common_1.Get)("games"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "games", null);
__decorate([
    (0, guard_1.Access)("admin", "activity.read"),
    (0, common_1.Get)(["game-sessions", "fighters", "fights"]),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "activity", null);
__decorate([
    (0, guard_1.Access)("admin", "rewards.read"),
    (0, common_1.Get)("rewards/batches"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "rewards", null);
__decorate([
    (0, guard_1.Access)("admin", "audit.read"),
    (0, common_1.Get)("audit-logs"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "audit", null);
__decorate([
    (0, guard_1.Access)("admin", "users.read"),
    (0, common_1.Get)("invitations"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "invitations", null);
__decorate([
    (0, guard_1.Access)("admin", "users.read"),
    (0, common_1.Get)("leaderboards"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "leaderboard", null);
__decorate([
    (0, guard_1.Access)("admin", "legacy.read"),
    (0, common_1.Get)(["import-batches", "legacy-identities"]),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "legacy", null);
__decorate([
    (0, guard_1.Access)("admin", "jobs.read"),
    (0, common_1.Get)(["jobs", "outbox"]),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "jobs", null);
__decorate([
    (0, guard_1.Access)("admin", "rewards.read"),
    (0, common_1.Get)([
        "orders",
        "settlements",
        "tournaments",
        "noova/configs",
        "noova/instances",
        "noova/managers",
        "noova/stats",
    ]),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListQuery]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "disabled", null);
__decorate([
    (0, guard_1.Access)("admin", "quests.write"),
    (0, common_1.Post)("quests"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QuestDto, Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "create", null);
__decorate([
    (0, guard_1.Access)("admin", "quests.write"),
    (0, common_1.Patch)("quests/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.QuestDto, Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "edit", null);
__decorate([
    (0, guard_1.Access)("admin", "quests.write"),
    (0, common_1.Patch)("quests/:id/status"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.StatusDto, Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "status", null);
__decorate([
    (0, guard_1.Access)("admin", "quests.write"),
    (0, common_1.Post)("quest-records/:id/review"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ReviewDto, Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "review", null);
__decorate([
    (0, guard_1.Access)("admin", "rewards.write"),
    (0, common_1.Post)("points/adjust"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.PointsDto, Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "adjust", null);
__decorate([
    (0, guard_1.Access)("admin", "rewards.write"),
    (0, common_1.Post)("quests/:id/budget"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.BudgetDto, Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "budget", null);
__decorate([
    (0, guard_1.Access)("admin", "settings.write"),
    (0, common_1.Patch)("settings"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.SettingsDto, Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "settingsUpdate", null);
__decorate([
    (0, guard_1.Access)("admin", "users.write"),
    (0, common_1.Patch)("users/:id/status"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Headers)("idempotency-key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UserStatusDto, Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "freeze", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)("Administration"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, guard_1.Access)("admin"),
    (0, common_1.Controller)("admin"),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        admin_service_1.AdminService,
        quests_service_1.QuestsService,
        query_service_1.QueryService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map