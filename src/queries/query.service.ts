import { Injectable } from "@nestjs/common";
import { Prisma, type Quest } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LedgerService, wallet } from "../assets/ledger.service";
import { QuestsService } from "../quests/quests.service";
import { Cursors, newest, offset, paged } from "../common/pagination";
import { fail, requireValue } from "../common/errors";
import {
  fighterView,
  fightView,
  gameView,
  ledgerView,
  questView,
  recordView,
  rewardView,
  sessionView,
  userView,
} from "../common/views";
import { period } from "../common/util";
import { publicPresentation } from "../public-presentation";
import type { ListQuery } from "../common/dto";
@Injectable()
export class QueryService {
  constructor(
    private readonly db: PrismaService,
    private readonly ledger: LedgerService,
    private readonly quests: QuestsService,
    private readonly cursors: Cursors,
  ) {}
  async publicConfig() {
    return {
      ...publicPresentation(
        await this.db.game.findMany({ orderBy: { id: "asc" } }),
      ),
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
  async games(q: ListQuery) {
    const where: Prisma.GameWhereInput = {
      slug: q.slug,
      kind: q.gameKind ?? q.kind,
      chainId: q.chainId,
      assetId: q.assetId,
      entryId: q.entryId,
      mode: q.mode,
      status: q.status,
    };
    return paged(
      q,
      this.db.game
        .findMany({ where, ...offset(q), orderBy: { id: "asc" } })
        .then((rows) => rows.map(gameView)),
      this.db.game.count({ where }),
    );
  }
  async game(id: string) {
    return {
      game: gameView(
        requireValue(await this.db.game.findUnique({ where: { id } })),
      ),
    };
  }
  async wins(q: ListQuery) {
    const rows = await this.db.liveWin.findMany({
      where: this.cursors.after(q, "live-wins"),
      orderBy: [...newest],
      take: q.pageSize + 1,
    });
    return this.cursors.result(rows, q, "live-wins", (row) => ({
      ...row,
      payoutAtomic: row.payoutAtomic.toFixed(0),
    }));
  }
  async dashboard(userId: string) {
    const [
      user,
      assets,
      sessions,
      fighters,
      unread,
      completedQuests,
      claimable,
    ] = await Promise.all([
      this.db.user.findUniqueOrThrow({ where: { id: userId } }),
      this.ledger.assets(this.db, userId),
      this.db.gameSession.findMany({
        where: { userId },
        orderBy: [...newest],
        take: 4,
      }),
      this.db.fighter.findMany({
        where: { userId },
        orderBy: [...newest],
        take: 100,
      }),
      this.db.notification.count({ where: { userId, readAt: null } }),
      this.db.questRecord.count({
        where: { userId, status: { in: ["completed", "reward_claimed"] } },
      }),
      this.db.reward.count({ where: { userId, status: "eligible" } }),
    ]);
    return {
      user: userView(user),
      assets,
      sessions: sessions.map(sessionView),
      fighters: fighters.map(fighterView),
      unread,
      completedQuests,
      claimable,
    };
  }
  async assets(userId: string) {
    return { items: await this.ledger.assets(this.db, userId) };
  }
  async ledgerList(userId: string, q: ListQuery, tickets = false) {
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
      orderBy: [...newest],
      take: q.pageSize + 1,
    });
    const result = this.cursors.result(rows, q, scope, ledgerView);
    if (!tickets) return result;
    return {
      ...result,
      balance: (await this.ledger.assets(this.db, userId)).find(
        (a) => a.assetId === "TICKET",
      ),
      lots: await this.db.ticketLot.findMany({
        where: { userId },
        orderBy: [...newest],
        take: 100,
      }),
    };
  }
  async sessions(userId: string, q: ListQuery) {
    const scope = `sessions:${userId}`;
    return this.cursors.result(
      await this.db.gameSession.findMany({
        where: {
          AND: [{ userId, status: q.status }, this.cursors.after(q, scope)],
        },
        orderBy: [...newest],
        take: q.pageSize + 1,
      }),
      q,
      scope,
      sessionView,
    );
  }
  async session(userId: string, id: string) {
    return {
      session: sessionView(
        requireValue(
          await this.db.gameSession.findFirst({ where: { id, userId } }),
        ),
      ),
    };
  }
  async fighters(userId: string) {
    return {
      items: (
        await this.db.fighter.findMany({
          where: { userId },
          orderBy: [...newest],
          take: 100,
        })
      ).map(fighterView),
      limit: (
        await this.db.setting.findUniqueOrThrow({ where: { id: "global" } })
      ).maxFighters,
    };
  }
  async fighter(userId: string, id: string) {
    return {
      fighter: fighterView(
        requireValue(
          await this.db.fighter.findFirst({ where: { id, userId } }),
        ),
      ),
    };
  }
  async fights(userId: string, q: ListQuery) {
    const scope = `fights:${userId}`;
    return this.cursors.result(
      await this.db.fight.findMany({
        where: {
          AND: [{ userId, status: q.status }, this.cursors.after(q, scope)],
        },
        orderBy: [...newest],
        take: q.pageSize + 1,
      }),
      q,
      scope,
      fightView,
    );
  }
  async fight(userId: string, id: string) {
    return {
      fight: fightView(
        requireValue(await this.db.fight.findFirst({ where: { id, userId } })),
      ),
    };
  }
  async questList(userId: string | undefined, q: ListQuery) {
    const join = Prisma.sql`FROM "Quest" q LEFT JOIN "QuestRecord" r ON r."questId" = q.id AND r."userId" = ${userId ?? ""} AND r."periodKey" = CASE WHEN q.type = 'daily' THEN ${period("daily")} ELSE 'once' END WHERE q.status = 'published' AND (${q.type ?? ""} = '' OR q.type = ${q.type ?? ""}) AND (${q.status ?? ""} = '' OR COALESCE(r.status, 'not_started') = ${q.status ?? ""})`;
    const [rows, counts] = await Promise.all([
      this.db.$queryRaw<(Quest & { userStatus: string })[]>(
        Prisma.sql`SELECT q.*, COALESCE(r.status, 'not_started') AS "userStatus" ${join} ORDER BY q."createdAt" DESC, q.id DESC LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
      ),
      this.db.$queryRaw<{ count: bigint }[]>(
        Prisma.sql`SELECT COUNT(*) AS count ${join}`,
      ),
    ]);
    return paged(
      q,
      Promise.resolve(rows.map((row) => questView(row, row.userStatus))),
      Promise.resolve(Number(counts[0].count)),
    );
  }
  async quest(userId: string | undefined, id: string) {
    const quest = requireValue(
      await this.db.quest.findFirst({ where: { id, status: "published" } }),
    );
    const r = userId
      ? await this.db.questRecord.findUnique({
          where: {
            userId_questId_periodKey: {
              userId,
              questId: id,
              periodKey: period(quest.type),
            },
          },
        })
      : null;
    return {
      quest: questView(quest, r?.status),
      record: r ? await this.quests.record(this.db, r.id) : null,
    };
  }
  rewards(userId: string, q: ListQuery) {
    const where = { userId, status: q.status };
    return paged(
      q,
      this.db.reward
        .findMany({ where, orderBy: [...newest], ...offset(q) })
        .then((r) => r.map(rewardView)),
      this.db.reward.count({ where }),
    );
  }
  async notifications(userId: string, q: ListQuery) {
    const scope = `notifications:${userId}`,
      where = {
        userId,
        type: q.type,
        ...(q.unread === "true" ? { readAt: null } : {}),
      };
    const [rows, snapshot] = await Promise.all([
      this.db.notification.findMany({
        where: { AND: [where, this.cursors.after(q, scope)] },
        orderBy: [...newest],
        take: q.pageSize + 1,
      }),
      this.db.notification.findMany({
        where: { userId, readAt: null },
        select: { id: true },
        take: 1000,
        orderBy: [...newest],
      }),
    ]);
    return {
      ...this.cursors.result(rows, q, scope, (r) => r),
      snapshotIds: snapshot.map((r) => r.id),
    };
  }
  async unread(userId: string) {
    return {
      count: await this.db.notification.count({
        where: { userId, readAt: null },
      }),
    };
  }
  pointLogs(userId: string, q: ListQuery) {
    const where = { userId, accountId: wallet(userId, "POINTS") };
    return paged(
      q,
      this.db.ledgerEntry
        .findMany({ where, ...offset(q), orderBy: [...newest] })
        .then((r) => r.map(ledgerView)),
      this.db.ledgerEntry.count({ where }),
    );
  }
  records(userId: string, q: ListQuery) {
    return paged(
      q,
      this.db.questRecord
        .findMany({ where: { userId }, ...offset(q), orderBy: [...newest] })
        .then((r) => r.map(recordView)),
      this.db.questRecord.count({ where: { userId } }),
    );
  }
  async invitations(userId: string, q: ListQuery) {
    const user = await this.db.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const [result, effectiveInvited] = await Promise.all([
      paged(
        q,
        this.db.user.findMany({
          where: { inviterId: userId },
          ...offset(q),
          orderBy: [...newest],
          select: { id: true, nickname: true, createdAt: true },
        }),
        this.db.invitation.count({ where: { inviterId: userId } }),
      ),
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
  async leaderboard(type: string, q: ListQuery) {
    if (!["points", "quests", "invitations"].includes(type))
      fail(422, "VALIDATION_ERROR", "Unknown leaderboard");
    const value =
      type === "points"
        ? Prisma.sql`u.points`
        : type === "quests"
          ? Prisma.sql`(SELECT COUNT(*) FROM "QuestRecord" r WHERE r."userId"=u.id AND r.status IN ('completed','reward_claimed'))`
          : Prisma.sql`(SELECT COUNT(*) FROM "Invitation" i WHERE i."inviterId"=u.id AND i."effectiveAt" IS NOT NULL)`;
    const rows = await this.db.$queryRaw<
      {
        id: string;
        nickname: string;
        level: string;
        value: string;
        rank: bigint;
      }[]
    >(
      Prisma.sql`SELECT id,nickname,level, value::text, ROW_NUMBER() OVER (ORDER BY value DESC,id) AS rank FROM (SELECT u.id,u.nickname,u.level, ${value} AS value FROM "User" u WHERE u.status='normal' AND u."actorType"='player') ranked ORDER BY ranked.value DESC,id LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
    );
    return {
      ...(await paged(
        q,
        Promise.resolve(rows.map((r) => ({ ...r, rank: Number(r.rank) }))),
        this.db.user.count({
          where: { status: "normal", actorType: "player" },
        }),
      )),
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
  async membership(userId: string) {
    const u = await this.db.user.findUniqueOrThrow({ where: { id: userId } });
    return {
      level: u.level,
      pointsExact: u.points.toFixed(0),
      tckBalance: "0",
      source: "demo",
    };
  }
  async holdings(userId: string) {
    const latest = await this.db.holdingSnapshot.findFirst({
      where: { userId },
      orderBy: [...newest],
    });
    return {
      balance: latest?.balance.toFixed(0) ?? "0",
      tckBalance: latest?.balance.toFixed(0) ?? "0",
      source: "demo",
      syncedAt: latest?.createdAt ?? null,
      items: latest ? [{ ...latest, balance: latest.balance.toFixed(0) }] : [],
    };
  }
}
