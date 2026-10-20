import { Injectable } from "@nestjs/common";
import type { Tx } from "../prisma/prisma.service";
import { fail } from "../common/errors";
import { levelFor } from "../common/util";
export const wallet = (userId: string, asset: string) =>
  `user:${userId}:${asset}`;
export const treasury = (asset: string) => `treasury:${asset}`;
export const hold = (id: string, asset: string) => `hold:${id}:${asset}`;
export const budget = (questId: string) => `budget:${questId}:POINTS`;
@Injectable()
export class LedgerService {
  async account(
    tx: Tx,
    id: string,
    assetId: string,
    kind = "escrow",
    userId?: string,
  ) {
    return tx.account.upsert({
      where: { id },
      create: { id, assetId, kind, userId },
      update: {},
    });
  }
  async transfer(
    tx: Tx,
    businessKey: string,
    assetId: string,
    from: string,
    to: string,
    amount: bigint,
    reason: string,
    referenceId: string,
  ) {
    if (amount <= 0n || amount >= 10n ** 77n || from === to)
      fail(422, "AMOUNT_OUT_OF_RANGE", "Invalid transfer");
    const previous = await tx.ledgerTransaction.findUnique({
      where: { businessKey },
    });
    if (previous) return previous;
    const accounts = await tx.account.findMany({
      where: { id: { in: [from, to] } },
    });
    const source = accounts.find((a) => a.id === from),
      destination = accounts.find((a) => a.id === to);
    if (
      !source ||
      !destination ||
      source.assetId !== assetId ||
      destination.assetId !== assetId
    )
      fail(409, "ASSET_NETWORK_MISMATCH", "Asset accounts do not match");
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
      fail(
        409,
        source.kind === "budget" || source.kind === "treasury"
          ? "BUDGET_EXHAUSTED"
          : "INSUFFICIENT_BALANCE",
        "Insufficient available balance",
      );
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
      for (const account of accounts.filter(
        (a) => a.userId && a.kind === "available",
      )) {
        const balance = (
          await tx.account.findUniqueOrThrow({ where: { id: account.id } })
        ).balance;
        await tx.user.update({
          where: { id: account.userId! },
          data: {
            points: balance,
            level: levelFor(BigInt(balance.toFixed(0))),
          },
        });
      }
    return transaction;
  }
  async assets(tx: Tx, userId: string) {
    const [assets, accounts] = await Promise.all([
      tx.asset.findMany({ orderBy: { id: "asc" } }),
      tx.account.findMany({ where: { userId } }),
    ]);
    return assets.map((a) => ({
      assetId: a.id,
      symbol: a.symbol,
      chainId: a.chainId,
      decimals: a.decimals,
      availableAtomic:
        accounts
          .find((x) => x.assetId === a.id && x.kind === "available")
          ?.balance.toFixed(0) ?? "0",
      lockedAtomic: accounts
        .filter((x) => x.assetId === a.id && x.kind === "hold")
        .reduce((total, x) => total + BigInt(x.balance.toFixed(0)), 0n)
        .toString(),
    }));
  }
  async signup(tx: Tx, userId: string) {
    for (const assetId of ["SSC", "IP", "POINTS", "TICKET"])
      await this.account(
        tx,
        wallet(userId, assetId),
        assetId,
        "available",
        userId,
      );
    await this.transfer(
      tx,
      `welcome:ssc:${userId}`,
      "SSC",
      treasury("SSC"),
      wallet(userId, "SSC"),
      1000n,
      "demo_welcome",
      userId,
    );
    await this.transfer(
      tx,
      `welcome:ticket:${userId}`,
      "TICKET",
      treasury("TICKET"),
      wallet(userId, "TICKET"),
      3n,
      "demo_welcome",
      userId,
    );
    await tx.ticketLot.create({
      data: { userId, businessKey: `welcome:${userId}`, remaining: 3 },
    });
  }
  async lockTicket(tx: Tx, userId: string, businessKey: string) {
    const lot = await tx.ticketLot.findFirst({
      where: {
        userId,
        purpose: "fighter",
        remaining: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ expiresAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    });
    if (!lot) fail(409, "INSUFFICIENT_BALANCE", "No usable fighter tickets");
    const changed = await tx.ticketLot.updateMany({
      where: { id: lot.id, remaining: { gt: 0 } },
      data: { remaining: { decrement: 1 }, locked: { increment: 1 } },
    });
    if (!changed.count)
      fail(409, "INSUFFICIENT_BALANCE", "No usable fighter tickets");
    await this.account(
      tx,
      hold(businessKey, "TICKET"),
      "TICKET",
      "hold",
      userId,
    );
    await this.transfer(
      tx,
      `ticket:lock:${businessKey}`,
      "TICKET",
      wallet(userId, "TICKET"),
      hold(businessKey, "TICKET"),
      1n,
      "fighter_creation",
      businessKey,
    );
    await tx.ticketUse.create({ data: { userId, lotId: lot.id, businessKey } });
  }
  async settleTicket(
    tx: Tx,
    userId: string,
    businessKey: string,
    refund: boolean,
  ) {
    const use = await tx.ticketUse.findUniqueOrThrow({
      where: { businessKey },
    });
    if (use.status !== "locked") return;
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
    await this.transfer(
      tx,
      `ticket:settle:${businessKey}`,
      "TICKET",
      hold(businessKey, "TICKET"),
      refund ? wallet(userId, "TICKET") : treasury("TICKET"),
      1n,
      refund ? "fighter_refund" : "fighter_consumed",
      businessKey,
    );
  }
}
