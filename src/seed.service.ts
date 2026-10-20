import { PrismaService } from "./prisma/prisma.service";
import { LedgerService, budget, treasury } from "./assets/ledger.service";
import { games, initialQuests } from "./seed-data";
import { passwordHash } from "./common/util";
export async function seed(
  db: PrismaService,
  ledger: LedgerService,
  username?: string,
  password?: string,
) {
  if (
    username &&
    (!password || password.length < 12 || /replace|change-this/i.test(password))
  )
    throw new Error(
      "ADMIN_PASSWORD must be a non-default password with at least 12 characters",
    );
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
      await ledger.account(tx, treasury(id), id, "treasury");
      await ledger.transfer(
        tx,
        `seed:treasury:${id}`,
        id,
        `issuer:${id}`,
        treasury(id),
        1000000000000n,
        "demo_issuance",
        id,
      );
    }
    for (const g of games) {
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
    for (const q of initialQuests()) {
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
      await ledger.account(tx, budget(q.id), "POINTS", "budget");
      await ledger.transfer(
        tx,
        `seed:budget:${q.id}`,
        "POINTS",
        treasury("POINTS"),
        budget(q.id),
        1000000n,
        "quest_budget",
        q.id,
      );
    }
    if (username && password) {
      const existing = await tx.admin.findUnique({ where: { username } });
      if (!existing) {
        const admin = await tx.admin.create({
          data: {
            username,
            passwordHash: passwordHash(password),
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
