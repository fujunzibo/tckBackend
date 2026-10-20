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
exports.QuestsService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const ledger_service_1 = require("../assets/ledger.service");
const events_service_1 = require("../jobs/events.service");
const errors_1 = require("../common/errors");
const util_1 = require("../common/util");
const views_1 = require("../common/views");
let QuestsService = class QuestsService {
    ledger;
    events;
    constructor(ledger, events) {
        this.ledger = ledger;
        this.events = events;
    }
    async record(tx, id) {
        const r = await tx.questRecord.findUniqueOrThrow({ where: { id } });
        const [history, reward] = await Promise.all([
            tx.questSubmission.findMany({
                where: { recordId: id },
                orderBy: { submittedAt: "desc" },
            }),
            tx.reward.findUnique({ where: { recordId: id } }),
        ]);
        return {
            ...(0, views_1.recordView)(r),
            history: history.map((h) => ({
                proof: h.proof,
                reason: h.reason,
                submittedAt: h.submittedAt,
                action: h.action,
            })),
            rewardGrantId: reward?.id,
        };
    }
    async submit(tx, userId, questId, proof = "") {
        if (questId === "community-feedback" && proof.trim().length < 10)
            (0, errors_1.fail)(422, "VALIDATION_ERROR", "Feedback needs at least 10 characters");
        const quest = (0, errors_1.requireValue)(await tx.quest.findUnique({ where: { id: questId } }));
        if (quest.status !== "published" ||
            quest.startTime > new Date() ||
            quest.endTime <= new Date())
            (0, errors_1.fail)(409, "QUEST_EXPIRED", "Quest is unavailable");
        const periodKey = (0, util_1.period)(quest.type);
        const previous = await tx.questRecord.findUnique({
            where: { userId_questId_periodKey: { userId, questId, periodKey } },
        });
        if (previous && previous.status !== "rejected")
            (0, errors_1.fail)(409, "STATE_CONFLICT", "Quest already submitted");
        if (quest.type === "game") {
            if (!(await tx.gameSession.findFirst({
                where: { id: proof.trim(), userId, status: "settled" },
            })))
                (0, errors_1.fail)(422, "VALIDATION_ERROR", "Submit an owned and settled round ID");
        }
        else if (quest.type !== "daily" && proof.trim().length < 3)
            (0, errors_1.fail)(422, "VALIDATION_ERROR", "Proof is required");
        const values = {
            proof: proof.trim(),
            status: quest.reviewMode === "auto" ? "completed" : "pending_review",
            rejectReason: null,
            rewardAmount: quest.rewardAmount,
            questVersion: quest.version,
            submittedAt: new Date(),
        };
        const record = previous
            ? await tx.questRecord.update({
                where: { id: previous.id },
                data: { ...values, version: { increment: 1 } },
            })
            : await tx.questRecord.create({
                data: { userId, questId, periodKey, ...values },
            });
        await tx.questSubmission.create({
            data: {
                recordId: record.id,
                version: record.version,
                proof: record.proof,
            },
        });
        if (record.status === "completed")
            await this.grant(tx, record.id);
        return { record: await this.record(tx, record.id) };
    }
    async review(tx, actor, id, dto) {
        const record = (0, errors_1.requireValue)(await tx.questRecord.findUnique({ where: { id } }));
        const quest = await tx.quest.findUniqueOrThrow({
            where: { id: record.questId },
        });
        if (actor.role === "project_operator" &&
            !actor.entryIds?.includes(quest.entryId))
            (0, errors_1.fail)(403, "FORBIDDEN", "Quest is outside your entry scope");
        if (record.status !== "pending_review" || record.version !== dto.version)
            (0, errors_1.fail)(409, "VERSION_CONFLICT", "Submission has changed");
        if (dto.action === "reject" && (dto.reason?.trim().length ?? 0) < 3)
            (0, errors_1.fail)(422, "VALIDATION_ERROR", "A rejection reason is required");
        await tx.questRecord.update({
            where: { id },
            data: {
                status: dto.action === "approve" ? "completed" : "rejected",
                rejectReason: dto.action === "reject" ? dto.reason.trim() : null,
                version: { increment: 1 },
            },
        });
        await tx.questSubmission.update({
            where: { recordId_version: { recordId: id, version: record.version } },
            data: {
                action: dto.action,
                reason: dto.reason,
                reviewerId: actor.id,
                reviewedAt: new Date(),
            },
        });
        if (dto.action === "approve")
            await this.grant(tx, id);
        else
            await this.events.emit(tx, `quest:rejected:${id}:${record.version}`, "quest.updated", record.userId, id, record.version + 1, (0, util_1.copy)("任务需要补充资料", "Quest needs changes"), `/quests/${record.questId}`);
        return { record: await this.record(tx, id) };
    }
    async grant(tx, recordId) {
        if (await tx.reward.findUnique({ where: { recordId } }))
            return;
        const r = await tx.questRecord.findUniqueOrThrow({
            where: { id: recordId },
        }), quest = await tx.quest.findUniqueOrThrow({ where: { id: r.questId } });
        const id = (0, node_crypto_1.randomUUID)();
        await this.ledger.account(tx, (0, ledger_service_1.hold)(`reward:${id}`, "POINTS"), "POINTS");
        await this.ledger.transfer(tx, `reward:reserve:${id}`, "POINTS", (0, ledger_service_1.budget)(quest.id), (0, ledger_service_1.hold)(`reward:${id}`, "POINTS"), BigInt(r.rewardAmount.toFixed(0)), "reward_reserve", id);
        await tx.reward.create({
            data: {
                id,
                userId: r.userId,
                questId: r.questId,
                recordId,
                title: quest.title,
                amountAtomic: r.rewardAmount,
            },
        });
        await tx.invitation.updateMany({
            where: { inviteeId: r.userId, effectiveAt: null },
            data: { effectiveAt: new Date() },
        });
        await this.events.emit(tx, `quest:approved:${recordId}`, "quest.updated", r.userId, recordId, r.version, (0, util_1.copy)("任务审核通过", "Quest approved"), "/rewards");
    }
    async claim(tx, userId, rewardId, questId) {
        let reward = rewardId
            ? await tx.reward.findFirst({ where: { id: rewardId, userId } })
            : null;
        if (questId) {
            const quest = (0, errors_1.requireValue)(await tx.quest.findUnique({ where: { id: questId } }));
            const record = await tx.questRecord.findUnique({
                where: {
                    userId_questId_periodKey: {
                        userId,
                        questId,
                        periodKey: (0, util_1.period)(quest.type),
                    },
                },
            });
            if (record)
                reward = await tx.reward.findUnique({ where: { recordId: record.id } });
        }
        if (!reward)
            (0, errors_1.fail)(409, "REWARD_NOT_ELIGIBLE", "No eligible reward");
        if (reward.status === "issued")
            return { reward: (0, views_1.rewardView)(reward) };
        await this.ledger.transfer(tx, `reward:issue:${reward.id}`, "POINTS", (0, ledger_service_1.hold)(`reward:${reward.id}`, "POINTS"), (0, ledger_service_1.wallet)(userId, "POINTS"), BigInt(reward.amountAtomic.toFixed(0)), "quest_reward", reward.id);
        const issued = await tx.reward.update({
            where: { id: reward.id },
            data: { status: "issued", issuedAt: new Date() },
        });
        await tx.questRecord.update({
            where: { id: reward.recordId },
            data: { status: "reward_claimed", version: { increment: 1 } },
        });
        await this.events.emit(tx, `reward:issued:${reward.id}`, "reward.updated", userId, reward.id, 2, (0, util_1.copy)("奖励已到账", "Reward received"), "/rewards");
        return { reward: (0, views_1.rewardView)(issued) };
    }
};
exports.QuestsService = QuestsService;
exports.QuestsService = QuestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ledger_service_1.LedgerService,
        events_service_1.EventsService])
], QuestsService);
//# sourceMappingURL=quests.service.js.map