import { Injectable } from "@nestjs/common";
import { randomInt, randomUUID } from "node:crypto";
import { PrismaService, type Tx } from "../prisma/prisma.service";
import {
  LedgerService,
  hold,
  treasury,
  wallet,
} from "../assets/ledger.service";
import { EventsService } from "../jobs/events.service";
import { fail, requireValue } from "../common/errors";
import { copy, hash, secret } from "../common/util";
import { fighterView, fightView, sessionView } from "../common/views";
import { FIGHT_WIN_AMOUNT } from "../public-presentation";
import type { FighterDto } from "../common/dto";
@Injectable()
export class GamesService {
  constructor(
    private readonly db: PrismaService,
    private readonly ledger: LedgerService,
    private readonly events: EventsService,
  ) {}
  private async active(tx: Tx) {
    const settings = await tx.setting.findUniqueOrThrow({
      where: { id: "global" },
    });
    if (settings.maintenance)
      fail(409, "FEATURE_DISABLED", "New activity is paused");
    return settings;
  }
  async quote(tx: Tx, userId: string, gameId: string, choice: string) {
    await this.active(tx);
    const game = requireValue(
      await tx.game.findUnique({ where: { id: gameId } }),
    );
    if (
      game.status !== "available" ||
      game.kind !== "coin_flip" ||
      game.mode !== "demo"
    )
      fail(409, "FEATURE_DISABLED", "Game is unavailable");
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
        maximumPayoutAtomic: (
          BigInt(quote.amountAtomic.toFixed(0)) * 2n
        ).toString(),
      },
    };
  }
  async start(tx: Tx, userId: string, gameId: string, quoteId: string) {
    const quote = requireValue(
      await tx.gameQuote.findFirst({ where: { id: quoteId, userId, gameId } }),
    );
    if (quote.consumedBy)
      return {
        session: sessionView(
          await tx.gameSession.findUniqueOrThrow({
            where: { id: quote.consumedBy },
          }),
        ),
      };
    await this.active(tx);
    const game = requireValue(
      await tx.game.findUnique({ where: { id: gameId } }),
    );
    if (game.status !== "available")
      fail(409, "FEATURE_DISABLED", "Game is unavailable");
    if (quote.expiresAt <= new Date())
      fail(409, "QUOTE_EXPIRED", "Quote expired");
    const amount = BigInt(quote.amountAtomic.toFixed(0)),
      id = randomUUID(),
      randomSeed = secret();
    const outcome =
      parseInt(hash(randomSeed).slice(0, 2), 16) % 2 === 0 ? "heads" : "tails";
    await this.ledger.account(
      tx,
      hold(id, quote.assetId),
      quote.assetId,
      "hold",
      userId,
    );
    await this.ledger.account(
      tx,
      hold(`payout:${id}`, quote.assetId),
      quote.assetId,
    );
    await this.ledger.transfer(
      tx,
      `game:lock:${id}`,
      quote.assetId,
      wallet(userId, quote.assetId),
      hold(id, quote.assetId),
      amount,
      "game_entry",
      id,
    );
    await this.ledger.transfer(
      tx,
      `game:reserve:${id}`,
      quote.assetId,
      treasury(quote.assetId),
      hold(`payout:${id}`, quote.assetId),
      amount * 2n,
      "game_reserve",
      id,
    );
    const session = await tx.gameSession.create({
      data: {
        id,
        userId,
        gameId,
        quoteId,
        choice: quote.choice,
        outcome,
        randomSeed,
        resultHash: hash(`${id}:${quote.ruleVersion}:${randomSeed}:${outcome}`),
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
    await this.events.job(
      tx,
      `game:${id}`,
      "game",
      id,
      userId,
      session.readyAt,
    );
    return { session: sessionView(session) };
  }
  async createFighter(
    tx: Tx,
    userId: string,
    dto?: FighterDto,
    retryId?: string,
  ) {
    const settings = await this.active(tx);
    const old = retryId
      ? requireValue(
          await tx.fighter.findFirst({ where: { id: retryId, userId } }),
        )
      : undefined;
    if (old && old.status !== "failed")
      fail(409, "STATE_CONFLICT", "Only failed fighters can be retried");
    const count = await tx.fighter.count({
      where: { userId, status: { not: "failed" } },
    });
    if (count >= settings.maxFighters)
      fail(409, "FIGHTER_LIMIT_REACHED", "Fighter quota reached");
    const id = old?.id ?? randomUUID(),
      attempt = (old?.attempt ?? 0) + 1,
      businessKey = `fighter:${id}:${attempt}`;
    await this.ledger.lockTicket(tx, userId, businessKey);
    const values = {
      name: old?.name ?? dto!.name.trim(),
      style: old?.style ?? dto!.style,
      status: "generating",
      power: randomInt(55, 96),
      speed: randomInt(55, 96),
      defense: randomInt(55, 96),
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
    await this.events.job(
      tx,
      businessKey,
      "fighter",
      id,
      userId,
      fighter.readyAt,
    );
    return { fighter: fighterView(fighter) };
  }
  async fight(tx: Tx, userId: string, fighterId: string) {
    await this.active(tx);
    const fighter = requireValue(
      await tx.fighter.findFirst({ where: { id: fighterId, userId } }),
    );
    if (fighter.status !== "ready")
      fail(409, "STATE_CONFLICT", "Fighter is not ready");
    if (
      await tx.fight.count({
        where: { fighterId, status: { in: ["queued", "live"] } },
      })
    )
      fail(409, "FIGHTER_BUSY", "Fighter is already in a match");
    const id = randomUUID(),
      randomSeed = secret(),
      won = parseInt(hash(randomSeed).slice(0, 2), 16) % 2 === 0;
    await this.ledger.account(tx, hold(`fight:${id}`, "IP"), "IP");
    await this.ledger.transfer(
      tx,
      `fight:reserve:${id}`,
      "IP",
      treasury("IP"),
      hold(`fight:${id}`, "IP"),
      FIGHT_WIN_AMOUNT,
      "fight_reserve",
      id,
    );
    const fight = await tx.fight.create({
      data: {
        id,
        userId,
        fighterId,
        won,
        randomSeed,
        resultHash: hash(`${id}:fight-demo-v1:${randomSeed}:${won}`),
        readyAt: new Date(Date.now() + 6500),
      },
    });
    await this.events.job(
      tx,
      `fight:start:${id}`,
      "fight_start",
      id,
      userId,
      new Date(Date.now() + 1200),
    );
    await this.events.job(
      tx,
      `fight:settle:${id}`,
      "fight",
      id,
      userId,
      fight.readyAt,
    );
    return { fight: fightView(fight) };
  }
  async finish(
    tx: Tx,
    type: string,
    entityId: string,
    businessKey: string,
    failed = false,
  ) {
    if (type === "game") {
      const s = await tx.gameSession.findUniqueOrThrow({
        where: { id: entityId },
      });
      if (s.status !== "playing") return;
      const amount = BigInt(s.amountAtomic.toFixed(0)),
        won = s.payoutAtomic.greaterThan(0) && !failed;
      await this.ledger.transfer(
        tx,
        `game:consume:${s.id}`,
        s.assetId,
        hold(s.id, s.assetId),
        failed ? wallet(s.userId, s.assetId) : treasury(s.assetId),
        amount,
        failed ? "game_refund" : "game_consumed",
        s.id,
      );
      await this.ledger.transfer(
        tx,
        `game:payout:${s.id}`,
        s.assetId,
        hold(`payout:${s.id}`, s.assetId),
        won ? wallet(s.userId, s.assetId) : treasury(s.assetId),
        amount * 2n,
        won ? "game_reward" : "game_reserve_release",
        s.id,
      );
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
      await this.events.emit(
        tx,
        `game:finished:${s.id}`,
        "game.settled",
        s.userId,
        s.id,
        s.version + 1,
        copy(
          failed ? "对局失败，费用已退还" : "模拟对局已结算",
          failed ? "Round failed; entry refunded" : "Demo round settled",
        ),
        `/games/coin-flip?session=${s.id}`,
      );
    } else if (type === "fighter") {
      const f = await tx.fighter.findUniqueOrThrow({ where: { id: entityId } });
      if (
        f.status !== "generating" ||
        businessKey !== `fighter:${f.id}:${f.attempt}`
      )
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
      await this.events.emit(
        tx,
        `${businessKey}:finished`,
        "fighter.updated",
        f.userId,
        f.id,
        f.version + 1,
        copy(
          refund ? "生成失败，票券已返还" : "你的角色已就绪",
          refund
            ? "Generation failed; ticket refunded"
            : "Your fighter is ready",
        ),
        `/fighters/${f.id}`,
      );
    } else if (type === "fight_start") {
      await tx.fight.updateMany({
        where: { id: entityId, status: "queued" },
        data: { status: "live", version: { increment: 1 } },
      });
    } else if (type === "fight") {
      const f = await tx.fight.findUniqueOrThrow({ where: { id: entityId } });
      if (!["queued", "live"].includes(f.status)) return;
      await this.ledger.transfer(
        tx,
        `fight:payout:${f.id}`,
        "IP",
        hold(`fight:${f.id}`, "IP"),
        f.won && !failed ? wallet(f.userId, "IP") : treasury("IP"),
        FIGHT_WIN_AMOUNT,
        f.won && !failed ? "fight_reward" : "fight_reserve_release",
        f.id,
      );
      await tx.fight.update({
        where: { id: f.id },
        data: {
          status: failed ? "failed" : "settled",
          settledAt: new Date(),
          version: { increment: 1 },
        },
      });
      await this.events.emit(
        tx,
        `fight:finished:${f.id}`,
        "fighter.updated",
        f.userId,
        f.id,
        f.version + 1,
        copy(
          failed ? "模拟比赛未完成" : "模拟对战已结束",
          failed ? "Demo fight failed" : "Demo fight finished",
        ),
        `/fights/${f.id}`,
      );
    } else fail(422, "VALIDATION_ERROR", "Unknown job type");
  }
}
