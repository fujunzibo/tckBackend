"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const ledger_service_1 = require("./assets/ledger.service");
const seed_data_1 = require("./seed-data");
const util_1 = require("./common/util");
async function seed(db, ledger, username, password) {
    if (username &&
        (!password || password.length < 12 || /replace|change-this/i.test(password)))
        throw new Error("ADMIN_PASSWORD must be a non-default password with at least 12 characters");
    await db.serial(async (tx) => {
        await db.lock(tx, "system:seed");
        await tx.setting.upsert({
            where: { id: "global" },
            create: {},
            update: {},
        });
        for (const id of ["SSC", "IP", "POINTS", "TICKET"]) {
            await tx.asset.upsert({
                where: { id },
                create: { id, symbol: id },
                update: {},
            });
            await ledger.account(tx, `issuer:${id}`, id, "issuer");
            await ledger.account(tx, (0, ledger_service_1.treasury)(id), id, "treasury");
            await ledger.transfer(tx, `seed:treasury:${id}`, id, `issuer:${id}`, (0, ledger_service_1.treasury)(id), 1000000000000n, "demo_issuance", id);
        }
        for (const g of seed_data_1.games) {
            const game = await tx.game.upsert({
                where: { id: g.id },
                create: g,
                update: {},
            });
            await tx.gameRule.upsert({
                where: { gameId_version: { gameId: game.id, version: game.version } },
                create: {
                    gameId: game.id,
                    version: game.version,
                    amountAtomic: game.costAtomic,
                },
                update: {},
            });
        }
        for (const q of (0, seed_data_1.initialQuests)()) {
            const { rewardType: _rewardType, ...value } = q;
            void _rewardType;
            await tx.quest.upsert({
                where: { id: q.id },
                create: {
                    ...value,
                    startTime: new Date(q.startTime),
                    endTime: new Date(q.endTime),
                },
                update: {},
            });
            await ledger.account(tx, (0, ledger_service_1.budget)(q.id), "POINTS", "budget");
            await ledger.transfer(tx, `seed:budget:${q.id}`, "POINTS", (0, ledger_service_1.treasury)("POINTS"), (0, ledger_service_1.budget)(q.id), 1000000n, "quest_budget", q.id);
        }
        if (username && password) {
            const existing = await tx.admin.findUnique({ where: { username } });
            if (!existing) {
                const admin = await tx.admin.create({
                    data: {
                        username,
                        passwordHash: (0, util_1.passwordHash)(password),
                        role: "system",
                    },
                });
                await tx.auditLog.create({
                    data: {
                        actor: "seed",
                        action: "admin.create",
                        target: admin.id,
                        reason: "Initial administrator",
                        requestId: "seed",
                    },
                });
            }
        }
    });
}
//# sourceMappingURL=seed.service.js.map