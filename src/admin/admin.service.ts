import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService, type Tx } from "../prisma/prisma.service";
import {
  LedgerService,
  budget,
  treasury,
  wallet,
} from "../assets/ledger.service";
import { QuestsService } from "../quests/quests.service";
import { QueryService } from "../queries/query.service";
import { fail, requireValue } from "../common/errors";
import { atomic, copy, json } from "../common/util";
import {
  fighterView,
  fightView,
  gameView,
  ledgerView,
  questView,
  rewardView,
  sessionView,
  userView,
} from "../common/views";
import { newest, offset, paged } from "../common/pagination";
import type { Actor } from "../auth/types";
import type {
  BudgetDto,
  ListQuery,
  PointsDto,
  QuestDto,
  SettingsDto,
  StatusDto,
} from "../common/dto";
@Injectable()
export class AdminService {
  constructor(
    private readonly db: PrismaService,
    private readonly ledger: LedgerService,
    private readonly quests: QuestsService,
    private readonly queries: QueryService,
  ) {}
  scope(actor: Actor): Prisma.QuestWhereInput {
    return actor.role === "project_operator"
      ? { entryId: { in: actor.entryIds ?? [] } }
      : {};
  }
  checkScope(actor: Actor, entryId: string) {
    if (actor.role === "project_operator" && !actor.entryIds?.includes(entryId))
      fail(403, "FORBIDDEN", "Entry is outside administrator scope");
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
  async users(q: ListQuery) {
    const where: Prisma.UserWhereInput = {
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
    return paged(
      q,
      this.db.user
        .findMany({ where, ...offset(q), orderBy: [...newest] })
        .then((r) => r.map(userView)),
      this.db.user.count({ where }),
    );
  }
  async user(id: string) {
    requireValue(await this.db.user.findUnique({ where: { id } }));
    return {
      ...(await this.queries.dashboard(id)),
      records: await this.db.questRecord
        .findMany({ where: { userId: id }, take: 100, orderBy: [...newest] })
        .then((rows) =>
          Promise.all(rows.map((r) => this.quests.record(this.db, r.id))),
        ),
    };
  }
  async questList(actor: Actor, q: ListQuery) {
    const where = { ...this.scope(actor), status: q.status, type: q.type };
    return paged(
      q,
      this.db.quest
        .findMany({ where, ...offset(q), orderBy: [...newest] })
        .then((r) => r.map((x) => questView(x))),
      this.db.quest.count({ where }),
    );
  }
  async recordList(actor: Actor, q: ListQuery) {
    const scope =
      actor.role === "project_operator"
        ? {
            questId: {
              in: (
                await this.db.quest.findMany({
                  where: this.scope(actor),
                  select: { id: true },
                })
              ).map((x) => x.id),
            },
          }
        : {};
    const where = { ...scope, status: q.reviewStatus, userId: q.userId };
    return paged(
      q,
      this.db.questRecord
        .findMany({
          where,
          ...offset(q),
          orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
        })
        .then((rows) =>
          Promise.all(rows.map((r) => this.quests.record(this.db, r.id))),
        ),
      this.db.questRecord.count({ where }),
    );
  }
  points(q: ListQuery) {
    const where: Prisma.LedgerEntryWhereInput = {
      assetId: "POINTS",
      userId: q.userId ?? { not: null },
      accountId: { startsWith: "user:" },
      reason: q.source,
    };
    return paged(
      q,
      this.db.ledgerEntry
        .findMany({ where, ...offset(q), orderBy: [...newest] })
        .then((r) => r.map(ledgerView)),
      this.db.ledgerEntry.count({ where }),
    );
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
  async resources(kind: string, actor: Actor, q: ListQuery) {
    const opts = { ...offset(q), orderBy: [...newest] };
    switch (kind) {
      case "games": {
        const where =
          actor.role === "project_operator"
            ? { entryId: { in: actor.entryIds ?? [] } }
            : {};
        return paged(
          q,
          this.db.game
            .findMany({ where, ...offset(q), orderBy: { id: "asc" } })
            .then((r) => r.map(gameView)),
          this.db.game.count({ where }),
        );
      }
      case "game-sessions":
        return paged(
          q,
          this.db.gameSession
            .findMany({ ...opts })
            .then((r) => r.map(sessionView)),
          this.db.gameSession.count(),
        );
      case "fighters":
        return paged(
          q,
          this.db.fighter.findMany(opts).then((r) => r.map(fighterView)),
          this.db.fighter.count(),
        );
      case "fights":
        return paged(
          q,
          this.db.fight.findMany(opts).then((r) => r.map(fightView)),
          this.db.fight.count(),
        );
      case "rewards/batches":
        return paged(
          q,
          this.db.reward.findMany(opts).then((r) => r.map(rewardView)),
          this.db.reward.count(),
        );
      case "audit-logs":
        return paged(
          q,
          this.db.auditLog.findMany(opts),
          this.db.auditLog.count(),
        );
      case "invitations":
        return paged(
          q,
          this.db.user.findMany({
            ...opts,
            where: { inviterId: { not: null } },
            select: {
              id: true,
              nickname: true,
              inviterId: true,
              createdAt: true,
            },
          }),
          this.db.invitation.count(),
        );
      case "import-batches":
        return paged(
          q,
          this.db.importBatch.findMany(opts),
          this.db.importBatch.count(),
        );
      case "legacy-identities":
        return paged(
          q,
          this.db.legacyIdentityLink.findMany(opts),
          this.db.legacyIdentityLink.count(),
        );
      case "jobs":
        return paged(
          q,
          this.db.job.findMany({ ...opts, where: { status: q.status } }),
          this.db.job.count({ where: { status: q.status } }),
        );
      case "outbox":
        return paged(q, this.db.outbox.findMany(opts), this.db.outbox.count());
      default:
        return {
          ...(await paged(q, Promise.resolve([]), Promise.resolve(0))),
          enabled: false,
          stage: kind.startsWith("noova") ? "P2" : "P1",
        };
    }
  }
  async audit(
    tx: Tx,
    actor: Actor,
    action: string,
    target: string,
    reason: string,
    requestId: string,
  ) {
    await tx.auditLog.create({
      data: { actor: actor.id, action, target, reason, requestId },
    });
  }
  async adjust(tx: Tx, dto: PointsDto) {
    requireValue(await tx.user.findUnique({ where: { id: dto.userId } }));
    const amount = atomic(dto.changeAmount, true, 1000000n);
    if (amount === 0n)
      fail(422, "AMOUNT_OUT_OF_RANGE", "Adjustment cannot be zero");
    const from =
        amount > 0n ? treasury("POINTS") : wallet(dto.userId, "POINTS"),
      to = amount > 0n ? wallet(dto.userId, "POINTS") : treasury("POINTS");
    const referenceId = crypto.randomUUID();
    await this.ledger.transfer(
      tx,
      `adjust:${referenceId}`,
      "POINTS",
      from,
      to,
      amount < 0n ? -amount : amount,
      "admin_adjustment",
      referenceId,
    );
    return {
      user: userView(
        await tx.user.findUniqueOrThrow({ where: { id: dto.userId } }),
      ),
      reason: dto.reason,
    };
  }
  async editQuest(tx: Tx, actor: Actor, dto: QuestDto, id?: string) {
    const old = id
      ? requireValue(await tx.quest.findUnique({ where: { id } }))
      : undefined;
    if (old) {
      this.checkScope(actor, old.entryId);
      if (dto.version !== old.version)
        fail(409, "VERSION_CONFLICT", "Quest has changed");
    }
    const entryId = dto.entryId ?? old?.entryId ?? "tck-originals";
    this.checkScope(actor, entryId);
    const amount = atomic(dto.rewardAmount, false, 1000000n);
    if (amount < 1n || new Date(dto.endTime) <= new Date(dto.startTime))
      fail(422, "VALIDATION_ERROR", "Invalid reward or quest dates");
    if (
      old &&
      old.type !== dto.type &&
      (await tx.questRecord.count({ where: { questId: old.id } }))
    )
      fail(
        409,
        "STATE_CONFLICT",
        "Cannot change the period of a quest with submissions",
      );
    const previousTitle = old?.title as Record<string, string> | undefined,
      previousDescription = old?.description as
        | Record<string, string>
        | undefined;
    const data = {
      title: {
        ...(previousTitle ?? copy(dto.title.trim())),
        zh: dto.title.trim(),
      },
      description: {
        ...(previousDescription ?? copy(dto.description.trim())),
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
      await this.ledger.account(tx, budget(quest.id), "POINTS", "budget");
    return { quest: questView(quest) };
  }
  async questStatus(tx: Tx, actor: Actor, id: string, dto: StatusDto) {
    const q = requireValue(await tx.quest.findUnique({ where: { id } }));
    this.checkScope(actor, q.entryId);
    if (q.version !== dto.version)
      fail(409, "VERSION_CONFLICT", "Quest has changed");
    return {
      quest: questView(
        await tx.quest.update({
          where: { id },
          data: { status: dto.status, version: { increment: 1 } },
        }),
      ),
    };
  }
  async addBudget(tx: Tx, id: string, dto: BudgetDto) {
    requireValue(await tx.quest.findUnique({ where: { id } }));
    await this.ledger.transfer(
      tx,
      `budget:topup:${crypto.randomUUID()}`,
      "POINTS",
      treasury("POINTS"),
      budget(id),
      atomic(dto.amountAtomic, false, 1000000000000n),
      "quest_budget",
      id,
    );
    return {
      questId: id,
      availableAtomic: (
        await tx.account.findUniqueOrThrow({ where: { id: budget(id) } })
      ).balance.toFixed(0),
    };
  }
  async getBudget(actor: Actor, id: string) {
    const quest = requireValue(
      await this.db.quest.findUnique({ where: { id } }),
    );
    this.checkScope(actor, quest.entryId);
    return {
      questId: id,
      availableAtomic: (
        await this.db.account.findUniqueOrThrow({ where: { id: budget(id) } })
      ).balance.toFixed(0),
      assetId: "POINTS",
    };
  }
  async saveSettings(tx: Tx, actor: Actor, dto: SettingsDto) {
    const amount = atomic(dto.gameCostAtomic, false, 1000n);
    if (amount < 1n) fail(422, "AMOUNT_OUT_OF_RANGE", "Invalid game cost");
    const changed = await tx.setting.updateMany({
      where: { id: "global", version: dto.version },
      data: {
        version: { increment: 1 },
        maintenance: dto.maintenance,
        gameCostAtomic: dto.gameCostAtomic,
        maxFighters: dto.maxFighters,
      },
    });
    if (!changed.count) fail(409, "VERSION_CONFLICT", "Settings have changed");
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
      data: { version: result.version, actorId: actor.id, value: json(result) },
    });
    return result;
  }
}
