"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerService = exports.budget = exports.hold = exports.treasury = exports.wallet = void 0;
const common_1 = require("@nestjs/common");
const errors_1 = require("../common/errors");
const util_1 = require("../common/util");
const wallet = (userId, asset) => `user:${userId}:${asset}`;
exports.wallet = wallet;
const treasury = (asset) => `treasury:${asset}`;
exports.treasury = treasury;
const hold = (id, asset) => `hold:${id}:${asset}`;
exports.hold = hold;
const budget = (questId) => `budget:${questId}:POINTS`;
exports.budget = budget;
let LedgerService = class LedgerService {
    async account(tx, id, assetId, kind = "escrow", userId) {
        return tx.account.upsert({
            where: { id },
            create: { id, assetId, kind, userId },
            update: {},
        });
    }
    async transfer(tx, businessKey, assetId, from, to, amount, reason, referenceId) {
        if (amount <= 0n || amount >= 10n ** 77n || from === to)
            (0, errors_1.fail)(422, "AMOUNT_OUT_OF_RANGE", "Invalid transfer");
        const previous = await tx.ledgerTransaction.findUnique({
            where: { businessKey },
        });
        if (previous)
            return previous;
        const accounts = await tx.account.findMany({
            where: { id: { in: [from, to] } },
        });
        const source = accounts.find((a) => a.id === from), destination = accounts.find((a) => a.id === to);
        if (!source ||
            !destination ||
            source.assetId !== assetId ||
            destination.assetId !== assetId)
            (0, errors_1.fail)(409, "ASSET_NETWORK_MISMATCH", "Asset accounts do not match");
        const debited = await tx.account.updateMany({
            where: {
                id: from,
                ...(source.kind === "issuer"
                    ? {}
                    : { balance: { gte: amount.toString() } }),
            },
            data: { balance: { decrement: amount.toString() } },
        });
        if (debited.count !== 1)
            (0, errors_1.fail)(409, source.kind === "budget" || source.kind === "treasury"
                ? "BUDGET_EXHAUSTED"
                : "INSUFFICIENT_BALANCE", "Insufficient available balance");
        await tx.account.update({
            where: { id: to },
            data: { balance: { increment: amount.toString() } },
        });
        const transaction = await tx.ledgerTransaction.create({
            data: { businessKey, reason, referenceId },
        });
        await tx.ledgerEntry.createMany({
            data: [
                {
                    transactionId: transaction.id,
                    accountId: from,
                    userId: source.userId,
                    assetId,
                    amount: (-amount).toString(),
                    reason,
                    businessId: referenceId,
                },
                {
                    transactionId: transaction.id,
                    accountId: to,
                    userId: destination.userId,
                    assetId,
                    amount: amount.toString(),
                    reason,
                    businessId: referenceId,
                },
            ],
        });
        if (assetId === "POINTS")
            for (const account of accounts.filter((a) => a.userId && a.kind === "available")) {
                const balance = (await tx.account.findUniqueOrThrow({ where: { id: account.id } })).balance;
                await tx.user.update({
                    where: { id: account.userId },
                    data: {
                        points: balance,
                        level: (0, util_1.levelFor)(BigInt(balance.toFixed(0))),
                    },
                });
            }
        return transaction;
    }
    async assets(tx, userId) {
        const [assets, accounts] = await Promise.all([
            tx.asset.findMany({ orderBy: { id: "asc" } }),
            tx.account.findMany({ where: { userId } }),
        ]);
        return assets.map((a) => ({
            assetId: a.id,
            symbol: a.symbol,
            chainId: a.chainId,
            decimals: a.decimals,
            availableAtomic: accounts
                .find((x) => x.assetId === a.id && x.kind === "available")
                ?.balance.toFixed(0) ?? "0",
            lockedAtomic: accounts
                .filter((x) => x.assetId === a.id && x.kind === "hold")
                .reduce((total, x) => total + BigInt(x.balance.toFixed(0)), 0n)
                .toString(),
        }));
    }
    async signup(tx, userId) {
        for (const assetId of ["SSC", "IP", "POINTS", "TICKET"])
            await this.account(tx, (0, exports.wallet)(userId, assetId), assetId, "available", userId);
        await this.transfer(tx, `welcome:ssc:${userId}`, "SSC", (0, exports.treasury)("SSC"), (0, exports.wallet)(userId, "SSC"), 1000n, "demo_welcome", userId);
        await this.transfer(tx, `welcome:ticket:${userId}`, "TICKET", (0, exports.treasury)("TICKET"), (0, exports.wallet)(userId, "TICKET"), 3n, "demo_welcome", userId);
        await tx.ticketLot.create({
            data: { userId, businessKey: `welcome:${userId}`, remaining: 3 },
        });
    }
    async lockTicket(tx, userId, businessKey) {
        const lot = await tx.ticketLot.findFirst({
            where: {
                userId,
                purpose: "fighter",
                remaining: { gt: 0 },
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        });
        if (!lot)
            (0, errors_1.fail)(409, "INSUFFICIENT_BALANCE", "No usable fighter tickets");
        const changed = await tx.ticketLot.updateMany({
            where: { id: lot.id, remaining: { gt: 0 } },
            data: { remaining: { decrement: 1 }, locked: { increment: 1 } },
        });
        if (!changed.count)
            (0, errors_1.fail)(409, "INSUFFICIENT_BALANCE", "No usable fighter tickets");
        await this.account(tx, (0, exports.hold)(businessKey, "TICKET"), "TICKET", "hold", userId);
        await this.transfer(tx, `ticket:lock:${businessKey}`, "TICKET", (0, exports.wallet)(userId, "TICKET"), (0, exports.hold)(businessKey, "TICKET"), 1n, "fighter_creation", businessKey);
        await tx.ticketUse.create({ data: { userId, lotId: lot.id, businessKey } });
    }
    async settleTicket(tx, userId, businessKey, refund) {
        const use = await tx.ticketUse.findUniqueOrThrow({
            where: { businessKey },
        });
        if (use.status !== "locked")
            return;
        await tx.ticketUse.update({
            where: { id: use.id },
            data: { status: refund ? "refunded" : "consumed" },
        });
        await tx.ticketLot.update({
            where: { id: use.lotId },
            data: {
                locked: { decrement: 1 },
                ...(refund ? { remaining: { increment: 1 } } : {}),
            },
        });
        await this.transfer(tx, `ticket:settle:${businessKey}`, "TICKET", (0, exports.hold)(businessKey, "TICKET"), refund ? (0, exports.wallet)(userId, "TICKET") : (0, exports.treasury)("TICKET"), 1n, refund ? "fighter_refund" : "fighter_consumed", businessKey);
    }
};
exports.LedgerService = LedgerService;
exports.LedgerService = LedgerService = __decorate([
    (0, common_1.Injectable)()
], LedgerService);
//# sourceMappingURL=ledger.service.js.map