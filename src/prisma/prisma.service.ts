import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import type { Actor } from "../auth/types";
import { fail } from "../common/errors";
import { canonical, hash, json } from "../common/util";
export type Tx = Prisma.TransactionClient;
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: config.getOrThrow<string>("DATABASE_URL"),
        max: Number(config.get("DATABASE_POOL_MAX", 10)),
        connectionTimeoutMillis: Number(
          config.get("DATABASE_CONNECT_TIMEOUT_MS", 5000),
        ),
      }),
    });
  }
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
  async serial<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.$transaction(work, {
          isolationLevel: "Serializable",
          maxWait: 10000,
          timeout: 15000,
        });
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (
          !["P2034", "P2002", "40001", "40P01"].includes(code ?? "") ||
          attempt >= 5
        )
          throw error;
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 20));
      }
    }
  }
  async lock(tx: Tx, key: string) {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))::text`;
  }
  async assertActor(tx: Tx, actor: Actor) {
    const session = await tx.authSession.findUnique({
      where: { id: actor.sessionId },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.subjectId !== actor.id ||
      session.domain !== actor.domain
    )
      fail(401, "SESSION_REVOKED", "Please sign in again");
    if (actor.domain === "user") {
      const user = await tx.user.findUnique({ where: { id: actor.id } });
      if (!user || user.status !== "normal")
        fail(403, "USER_FROZEN", "Account is unavailable");
    } else {
      const admin = await tx.admin.findUnique({ where: { id: actor.id } });
      if (
        !admin?.enabled ||
        admin.role !== actor.role ||
        canonical(admin.entryIds) !== canonical(actor.entryIds)
      )
        fail(403, "FORBIDDEN", "Administrator permissions have changed");
    }
  }
  async command<T>(
    actor: Actor,
    operation: string,
    key: string | undefined,
    body: unknown,
    work: (tx: Tx) => Promise<T>,
  ): Promise<T> {
    if (!key || !/^[a-zA-Z0-9:_-]{8,128}$/.test(key))
      fail(422, "IDEMPOTENCY_KEY_REQUIRED", "Supply a valid Idempotency-Key");
    const subject = `${actor.domain}:${actor.id}`,
      requestHash = hash(canonical(body));
    return this.serial(async (tx) => {
      await this.lock(tx, subject);
      await this.assertActor(tx, actor);
      const previous = await tx.idempotency.findUnique({
        where: { subject_operation_key: { subject, operation, key } },
      });
      if (previous) {
        if (previous.hash !== requestHash)
          fail(
            409,
            "IDEMPOTENCY_CONFLICT",
            "This key was already used with different input",
          );
        return previous.response as T;
      }
      const response = await work(tx);
      await tx.idempotency.create({
        data: {
          subject,
          operation,
          key,
          hash: requestHash,
          response: json(response),
        },
      });
      return response;
    });
  }
}
