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
exports.GamesService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const ledger_service_1 = require("../assets/ledger.service");
const events_service_1 = require("../jobs/events.service");
const errors_1 = require("../common/errors");
const util_1 = require("../common/util");
const views_1 = require("../common/views");
const public_presentation_1 = require("../public-presentation");
let GamesService = class GamesService {
    db;
    ledger;
    events;
    constructor(db, ledger, events) {
        this.db = db;
        this.ledger = ledger;
        this.events = events;
    }
    async active(tx) {
        const settings = await tx.setting.findUniqueOrThrow({
            where: { id: "global" },
        });
        if (settings.maintenance)
            (0, errors_1.fail)(409, "FEATURE_DISABLED", "New activity is paused");
        return settings;
    }
    async quote(tx, userId, gameId, choice) {
        await this.active(tx);
        const game = (0, errors_1.requireValue)(await tx.game.findUnique({ where: { id: gameId } }));
        if (game.status !== "available" ||
            game.kind !== "coin_flip" ||
            game.mode !== "demo")
            (0, errors_1.fail)(409, "FEATURE_DISABLED", "Game is unavailable");
        const quote = await tx.gameQuote.create({
            data: {
                userId,
                gameId,
                choice,
                assetId: game.assetId,
                amountAtomic: game.costAtomic,
                ruleVersion: game.version,
                expiresAt: new Date(Date.now() + 60000),
            },
        });
        return {
            quote: {
                ...quote,
                amountAtomic: quote.amountAtomic.toFixed(0),
                decimals: 0,
                maximumPayoutAtomic: (BigInt(quote.amountAtomic.toFixed(0)) * 2n).toString(),
            },
        };
    }
    async start(tx, userId, gameId, quoteId) {
        const quote = (0, errors_1.requireValue)(await tx.gameQuote.findFirst({ where: { id: quoteId, userId, gameId } }));
        if (quote.consumedBy)
            return {
                session: (0, views_1.sessionView)(await tx.gameSession.findUniqueOrThrow({
                    where: { id: quote.consumedBy },
                })),
            };
        await this.active(tx);
        const game = (0, errors_1.requireValue)(await tx.game.findUnique({ where: { id: gameId } }));
        if (game.status !== "available")
            (0, errors_1.fail)(409, "FEATURE_DISABLED", "Game is unavailable");
        if (quote.expiresAt <= new Date())
            (0, errors_1.fail)(409, "QUOTE_EXPIRED", "Quote expired");
        const amount = BigInt(quote.amountAtomic.toFixed(0)), id = (0, node_crypto_1.randomUUID)(), randomSeed = (0, util_1.secret)();
        const outcome = parseInt((0, util_1.hash)(randomSeed).slice(0, 2), 16) % 2 === 0 ? "heads" : "tails";
        await this.ledger.account(tx, (0, ledger_service_1.hold)(id, quote.assetId), quote.assetId, "hold", userId);
        await this.ledger.account(tx, (0, ledger_service_1.hold)(`payout:${id}`, quote.assetId), quote.assetId);
        await this.ledger.transfer(tx, `game:lock:${id}`, quote.assetId, (0, ledger_service_1.wallet)(userId, quote.assetId), (0, ledger_service_1.hold)(id, quote.assetId), amount, "game_entry", id);
        await this.ledger.transfer(tx, `game:reserve:${id}`, quote.assetId, (0, ledger_service_1.treasury)(quote.assetId), (0, ledger_service_1.hold)(`payout:${id}`, quote.assetId), amount * 2n, "game_reserve", id);
        const session = await tx.gameSession.create({
            data: {
                id,
                userId,
                gameId,
                quoteId,
                choice: quote.choice,
                outcome,
                randomSeed,
                resultHash: (0, util_1.hash)(`${id}:${quote.ruleVersion}:${randomSeed}:${outcome}`),
                ruleVersion: quote.ruleVersion,
                amountAtomic: quote.amountAtomic,
                payoutAtomic: outcome === quote.choice ? (amount * 2n).toString() : "0",
                assetId: quote.assetId,
                readyAt: new Date(Date.now() + 2200),
            },
        });
        await tx.gameQuote.update({
            where: { id: quoteId },
            data: { consumedBy: id },
        });
        await this.events.job(tx, `game:${id}`, "game", id, userId, session.readyAt);
        return { session: (0, views_1.sessionView)(session) };
    }
    async createFighter(tx, userId, dto, retryId) {
        const settings = await this.active(tx);
        const old = retryId
            ? (0, errors_1.requireValue)(await tx.fighter.findFirst({ where: { id: retryId, userId } }))
            : undefined;
        if (old && old.status !== "failed")
            (0, errors_1.fail)(409, "STATE_CONFLICT", "Only failed fighters can be retried");
        const count = await tx.fighter.count({
            where: { userId, status: { not: "failed" } },
        });
        if (count >= settings.maxFighters)
            (0, errors_1.fail)(409, "FIGHTER_LIMIT_REACHED", "Fighter quota reached");
        const id = old?.id ?? (0, node_crypto_1.randomUUID)(), attempt = (old?.attempt ?? 0) + 1, businessKey = `fighter:${id}:${attempt}`;
        await this.ledger.lockTicket(tx, userId, businessKey);
        const values = {
            name: old?.name ?? dto.name.trim(),
            style: old?.style ?? dto.style,
            status: "generating",
            power: (0, node_crypto_1.randomInt)(55, 96),
            speed: (0, node_crypto_1.randomInt)(55, 96),
            defense: (0, node_crypto_1.randomInt)(55, 96),
            attempt,
            simulateFailure: old ? false : dto?.simulateFailure === true,
            refunded: false,
            readyAt: new Date(Date.now() + 4000),
        };
        const fighter = old
            ? await tx.fighter.update({
                where: { id },
                data: { ...values, version: { increment: 1 } },
            })
            : await tx.fighter.create({ data: { id, userId, ...values } });
        await this.events.job(tx, businessKey, "fighter", id, userId, fighter.readyAt);
        return { fighter: (0, views_1.fighterView)(fighter) };
    }
    async fight(tx, userId, fighterId) {
        await this.active(tx);
        const fighter = (0, errors_1.requireValue)(await tx.fighter.findFirst({ where: { id: fighterId, userId } }));
        if (fighter.status !== "ready")
            (0, errors_1.fail)(409, "STATE_CONFLICT", "Fighter is not ready");
        if (await tx.fight.count({
            where: { fighterId, status: { in: ["queued", "live"] } },
        }))
            (0, errors_1.fail)(409, "FIGHTER_BUSY", "Fighter is already in a match");
        const id = (0, node_crypto_1.randomUUID)(), randomSeed = (0, util_1.secret)(), won = parseInt((0, util_1.hash)(randomSeed).slice(0, 2), 16) % 2 === 0;
        await this.ledger.account(tx, (0, ledger_service_1.hold)(`fight:${id}`, "IP"), "IP");
        await this.ledger.transfer(tx, `fight:reserve:${id}`, "IP", (0, ledger_service_1.treasury)("IP"), (0, ledger_service_1.hold)(`fight:${id}`, "IP"), public_presentation_1.FIGHT_WIN_AMOUNT, "fight_reserve", id);
        const fight = await tx.fight.create({
            data: {
                id,
                userId,
                fighterId,
                won,
                randomSeed,
                resultHash: (0, util_1.hash)(`${id}:fight-demo-v1:${randomSeed}:${won}`),
                readyAt: new Date(Date.now() + 6500),
            },
        });
        await this.events.job(tx, `fight:start:${id}`, "fight_start", id, userId, new Date(Date.now() + 1200));
        await this.events.job(tx, `fight:settle:${id}`, "fight", id, userId, fight.readyAt);
        return { fight: (0, views_1.fightView)(fight) };
    }
    async finish(tx, type, entityId, businessKey, failed = false) {
        if (type === "game") {
            const s = await tx.gameSession.findUniqueOrThrow({
                where: { id: entityId },
            });
            if (s.status !== "playing")
                return;
            const amount = BigInt(s.amountAtomic.toFixed(0)), won = s.payoutAtomic.greaterThan(0) && !failed;
            await this.ledger.transfer(tx, `game:consume:${s.id}`, s.assetId, (0, ledger_service_1.hold)(s.id, s.assetId), failed ? (0, ledger_service_1.wallet)(s.userId, s.assetId) : (0, ledger_service_1.treasury)(s.assetId), amount, failed ? "game_refund" : "game_consumed", s.id);
            await this.ledger.transfer(tx, `game:payout:${s.id}`, s.assetId, (0, ledger_service_1.hold)(`payout:${s.id}`, s.assetId), won ? (0, ledger_service_1.wallet)(s.userId, s.assetId) : (0, ledger_service_1.treasury)(s.assetId), amount * 2n, won ? "game_reward" : "game_reserve_release", s.id);
            await tx.gameSession.update({
                where: { id: s.id },
                data: {
                    status: failed ? "failed" : "settled",
                    settledAt: new Date(),
                    version: { increment: 1 },
                },
            });
            if (won)
                await tx.liveWin.create({
                    data: {
                        sessionId: s.id,
                        gameId: s.gameId,
                        payoutAtomic: s.payoutAtomic,
                        assetId: s.assetId,
                        nickname: `Explorer · ${s.userId.slice(-4)}`,
                    },
                });
            await this.events.emit(tx, `game:finished:${s.id}`, "game.settled", s.userId, s.id, s.version + 1, (0, util_1.copy)(failed ? "对局失败，费用已退还" : "模拟对局已结算", failed ? "Round failed; entry refunded" : "Demo round settled"), `/games/coin-flip?session=${s.id}`);
        }
        else if (type === "fighter") {
            const f = await tx.fighter.findUniqueOrThrow({ where: { id: entityId } });
            if (f.status !== "generating" ||
                businessKey !== `fighter:${f.id}:${f.attempt}`)
                return;
            const refund = failed || f.simulateFailure;
            await this.ledger.settleTicket(tx, f.userId, businessKey, refund);
            await tx.fighter.update({
                where: { id: f.id },
                data: {
                    status: refund ? "failed" : "ready",
                    refunded: refund,
                    version: { increment: 1 },
                },
            });
            await this.events.emit(tx, `${businessKey}:finished`, "fighter.updated", f.userId, f.id, f.version + 1, (0, util_1.copy)(refund ? "生成失败，票券已返还" : "你的角色已就绪", refund
                ? "Generation failed; ticket refunded"
                : "Your fighter is ready"), `/fighters/${f.id}`);
        }
        else if (type === "fight_start") {
            await tx.fight.updateMany({
                where: { id: entityId, status: "queued" },
                data: { status: "live", version: { increment: 1 } },
            });
        }
        else if (type === "fight") {
            const f = await tx.fight.findUniqueOrThrow({ where: { id: entityId } });
            if (!["queued", "live"].includes(f.status))
                return;
            await this.ledger.transfer(tx, `fight:payout:${f.id}`, "IP", (0, ledger_service_1.hold)(`fight:${f.id}`, "IP"), f.won && !failed ? (0, ledger_service_1.wallet)(f.userId, "IP") : (0, ledger_service_1.treasury)("IP"), public_presentation_1.FIGHT_WIN_AMOUNT, f.won && !failed ? "fight_reward" : "fight_reserve_release", f.id);
            await tx.fight.update({
                where: { id: f.id },
                data: {
                    status: failed ? "failed" : "settled",
                    settledAt: new Date(),
                    version: { increment: 1 },
                },
            });
            await this.events.emit(tx, `fight:finished:${f.id}`, "fighter.updated", f.userId, f.id, f.version + 1, (0, util_1.copy)(failed ? "模拟比赛未完成" : "模拟对战已结束", failed ? "Demo fight failed" : "Demo fight finished"), `/fights/${f.id}`);
        }
        else
            (0, errors_1.fail)(422, "VALIDATION_ERROR", "Unknown job type");
    }
};
exports.GamesService = GamesService;
exports.GamesService = GamesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        events_service_1.EventsService])
], GamesService);
//# sourceMappingURL=games.service.js.map