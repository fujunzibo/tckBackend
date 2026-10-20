import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Prisma, type Job } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { GamesService } from "../games/games.service";
import { copy } from "../common/util";
@Injectable()
export class WorkerService {
  readonly id = randomUUID();
  private readonly logger = new Logger("Worker");
  constructor(
    private readonly db: PrismaService,
    private readonly games: GamesService,
  ) {}
  async tick() {
    await this.db.workerHeartbeat.upsert({
      where: { id: this.id },
      create: { id: this.id, at: new Date() },
      update: { at: new Date() },
    });
    const jobs = await this.db.$queryRaw<
      Job[]
    >`UPDATE "Job" SET status = 'running', "leaseOwner" = ${this.id}, "leaseUntil" = now() + interval '30 seconds', attempt = attempt + 1 WHERE id IN (SELECT id FROM "Job" WHERE (status = 'pending' AND "runAt" <= now()) OR (status = 'running' AND "leaseUntil" < now()) ORDER BY "runAt", id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`;
    for (const job of jobs) {
      try {
        await this.db.serial(async (tx) => {
          await this.db.lock(tx, `user:${job.userId}`);
          const current = await tx.job.findUniqueOrThrow({
            where: { id: job.id },
          });
          if (current.leaseOwner !== this.id || current.status !== "running")
            return;
          const exhausted = current.attempt > 5;
          await this.games.finish(
            tx,
            job.type,
            job.entityId,
            job.businessKey,
            exhausted,
          );
          await tx.job.update({
            where: { id: job.id },
            data: {
              status: exhausted ? "dead" : "completed",
              leaseOwner: null,
              leaseUntil: null,
              lastError: exhausted ? "MAX_ATTEMPTS" : null,
            },
          });
        });
      } catch (error) {
        const code = error instanceof Error ? error.name : "JobError";
        this.logger.error(
          JSON.stringify({
            jobId: job.id,
            type: job.type,
            attempt: job.attempt,
            code,
          }),
        );
        await this.db.serial(async (tx) => {
          await this.db.lock(tx, `user:${job.userId}`);
          const current = await tx.job.findUniqueOrThrow({
            where: { id: job.id },
          });
          if (current.leaseOwner !== this.id || current.status !== "running")
            return;
          if (job.attempt >= 5)
            await this.games.finish(
              tx,
              job.type,
              job.entityId,
              job.businessKey,
              true,
            );
          await tx.job.update({
            where: { id: job.id },
            data: {
              status: job.attempt >= 5 ? "dead" : "pending",
              runAt: new Date(
                Date.now() + 1000 * 2 ** Math.min(job.attempt, 6),
              ),
              leaseOwner: null,
              leaseUntil: null,
              lastError: code,
            },
          });
        });
      }
    }
    await this.publish();
    return jobs.length;
  }
  async publish() {
    return this.db.serial(async (tx) => {
      const events = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM "Outbox" WHERE "publishedAt" IS NULL ORDER BY "createdAt", id FOR UPDATE SKIP LOCKED LIMIT 50`;
      for (const item of events) {
        const event = await tx.outbox.findUniqueOrThrow({
          where: { id: item.id },
        });
        const payload = event.payload as {
          title: Prisma.InputJsonValue;
          href: string;
        };
        await tx.notification.upsert({
          where: { eventKey: event.eventKey },
          create: {
            userId: event.userId,
            eventKey: event.eventKey,
            type: event.type.split(".")[0],
            title: payload.title,
            body: copy(
              "状态已更新，点击查看详情。",
              "Your activity has been updated. Open for details.",
            ),
            href: payload.href,
          },
          update: {},
        });
        await tx.outbox.update({
          where: { id: event.id },
          data: { publishedAt: new Date() },
        });
      }
      return events.length;
    });
  }
}
