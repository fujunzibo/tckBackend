import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { Tx } from "../prisma/prisma.service";
import { LedgerService, budget, hold, wallet } from "../assets/ledger.service";
import { EventsService } from "../jobs/events.service";
import { fail, requireValue } from "../common/errors";
import { copy, period } from "../common/util";
import { recordView, rewardView } from "../common/views";
import type { Actor } from "../auth/types";
import type { ReviewDto } from "../common/dto";
@Injectable()
export class QuestsService {
  constructor(
    private readonly ledger: LedgerService,
    private readonly events: EventsService,
  ) {}
  async record(tx: Tx, id: string) {
    const r = await tx.questRecord.findUniqueOrThrow({ where: { id } });
    const [history, reward] = await Promise.all([
      tx.questSubmission.findMany({
        where: { recordId: id },
        orderBy: { submittedAt: "desc" },
      }),
      tx.reward.findUnique({ where: { recordId: id } }),
    ]);
    return {
      ...recordView(r),
      history: history.map((h) => ({
        proof: h.proof,
        reason: h.reason,
        submittedAt: h.submittedAt,
        action: h.action,
      })),
      rewardGrantId: reward?.id,
    };
  }
  async submit(tx: Tx, userId: string, questId: string, proof = "") {
    if (questId === "community-feedback" && proof.trim().length < 10)
      fail(422, "VALIDATION_ERROR", "Feedback needs at least 10 characters");
    const quest = requireValue(
      await tx.quest.findUnique({ where: { id: questId } }),
    );
    if (
      quest.status !== "published" ||
      quest.startTime > new Date() ||
      quest.endTime <= new Date()
    )
      fail(409, "QUEST_EXPIRED", "Quest is unavailable");
    const periodKey = period(quest.type);
    const previous = await tx.questRecord.findUnique({
      where: { userId_questId_periodKey: { userId, questId, periodKey } },
    });
    if (previous && previous.status !== "rejected")
      fail(409, "STATE_CONFLICT", "Quest already submitted");
    if (quest.type === "game") {
      if (
        !(await tx.gameSession.findFirst({
          where: { id: proof.trim(), userId, status: "settled" },
        }))
      )
        fail(422, "VALIDATION_ERROR", "Submit an owned and settled round ID");
    } else if (quest.type !== "daily" && proof.trim().length < 3)
      fail(422, "VALIDATION_ERROR", "Proof is required");
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
    if (record.status === "completed") await this.grant(tx, record.id);
    return { record: await this.record(tx, record.id) };
  }
  async review(tx: Tx, actor: Actor, id: string, dto: ReviewDto) {
    const record = requireValue(
      await tx.questRecord.findUnique({ where: { id } }),
    );
    const quest = await tx.quest.findUniqueOrThrow({
      where: { id: record.questId },
    });
    if (
      actor.role === "project_operator" &&
      !actor.entryIds?.includes(quest.entryId)
    )
      fail(403, "FORBIDDEN", "Quest is outside your entry scope");
    if (record.status !== "pending_review" || record.version !== dto.version)
      fail(409, "VERSION_CONFLICT", "Submission has changed");
    if (dto.action === "reject" && (dto.reason?.trim().length ?? 0) < 3)
      fail(422, "VALIDATION_ERROR", "A rejection reason is required");
    await tx.questRecord.update({
      where: { id },
      data: {
        status: dto.action === "approve" ? "completed" : "rejected",
        rejectReason: dto.action === "reject" ? dto.reason!.trim() : null,
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
    if (dto.action === "approve") await this.grant(tx, id);
    else
      await this.events.emit(
        tx,
        `quest:rejected:${id}:${record.version}`,
        "quest.updated",
        record.userId,
        id,
        record.version + 1,
        copy("任务需要补充资料", "Quest needs changes"),
        `/quests/${record.questId}`,
      );
    return { record: await this.record(tx, id) };
  }
  async grant(tx: Tx, recordId: string) {
    if (await tx.reward.findUnique({ where: { recordId } })) return;
    const r = await tx.questRecord.findUniqueOrThrow({
        where: { id: recordId },
      }),
      quest = await tx.quest.findUniqueOrThrow({ where: { id: r.questId } });
    const id = randomUUID();
    await this.ledger.account(tx, hold(`reward:${id}`, "POINTS"), "POINTS");
    await this.ledger.transfer(
      tx,
      `reward:reserve:${id}`,
      "POINTS",
      budget(quest.id),
      hold(`reward:${id}`, "POINTS"),
      BigInt(r.rewardAmount.toFixed(0)),
      "reward_reserve",
      id,
    );
    await tx.reward.create({
      data: {
        id,
        userId: r.userId,
        questId: r.questId,
        recordId,
        title: quest.title as Prisma.InputJsonValue,
        amountAtomic: r.rewardAmount,
      },
    });
    await tx.invitation.updateMany({
      where: { inviteeId: r.userId, effectiveAt: null },
      data: { effectiveAt: new Date() },
    });
    await this.events.emit(
      tx,
      `quest:approved:${recordId}`,
      "quest.updated",
      r.userId,
      recordId,
      r.version,
      copy("任务审核通过", "Quest approved"),
      "/rewards",
    );
  }
  async claim(tx: Tx, userId: string, rewardId?: string, questId?: string) {
    let reward = rewardId
      ? await tx.reward.findFirst({ where: { id: rewardId, userId } })
      : null;
    if (questId) {
      const quest = requireValue(
        await tx.quest.findUnique({ where: { id: questId } }),
      );
      const record = await tx.questRecord.findUnique({
        where: {
          userId_questId_periodKey: {
            userId,
            questId,
            periodKey: period(quest.type),
          },
        },
      });
      if (record)
        reward = await tx.reward.findUnique({ where: { recordId: record.id } });
    }
    if (!reward) fail(409, "REWARD_NOT_ELIGIBLE", "No eligible reward");
    if (reward.status === "issued") return { reward: rewardView(reward) };
    await this.ledger.transfer(
      tx,
      `reward:issue:${reward.id}`,
      "POINTS",
      hold(`reward:${reward.id}`, "POINTS"),
      wallet(userId, "POINTS"),
      BigInt(reward.amountAtomic.toFixed(0)),
      "quest_reward",
      reward.id,
    );
    const issued = await tx.reward.update({
      where: { id: reward.id },
      data: { status: "issued", issuedAt: new Date() },
    });
    await tx.questRecord.update({
      where: { id: reward.recordId },
      data: { status: "reward_claimed", version: { increment: 1 } },
    });
    await this.events.emit(
      tx,
      `reward:issued:${reward.id}`,
      "reward.updated",
      userId,
      reward.id,
      2,
      copy("奖励已到账", "Reward received"),
      "/rewards",
    );
    return { reward: rewardView(issued) };
  }
}
