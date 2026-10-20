import { Injectable } from "@nestjs/common";
import type { Tx } from "../prisma/prisma.service";
import { copy } from "../common/util";
@Injectable()
export class EventsService {
  async emit(
    tx: Tx,
    eventKey: string,
    type: string,
    userId: string,
    entityId: string,
    version: number,
    title: ReturnType<typeof copy>,
    href: string,
  ) {
    await tx.outbox.upsert({
      where: { eventKey },
      create: {
        eventKey,
        type,
        userId,
        entityId,
        entityVersion: version,
        payload: { title, href },
      },
      update: {},
    });
  }
  async job(
    tx: Tx,
    businessKey: string,
    type: string,
    entityId: string,
    userId: string,
    runAt: Date,
  ) {
    await tx.job.create({
      data: { businessKey, type, entityId, userId, runAt },
    });
  }
}
