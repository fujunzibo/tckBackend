import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService, type Tx } from "../prisma/prisma.service";
import { LedgerService } from "../assets/ledger.service";
import { fail, requireValue } from "../common/errors";
import { hash, passwordHash, passwordMatches, secret } from "../common/util";
import type { Actor } from "./types";
import type { AdminLoginDto, LoginDto } from "../common/dto";
import { userView } from "../common/views";
@Injectable()
export class AuthService {
  private readonly dummyHash = passwordHash(secret());
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly ledger: LedgerService,
  ) {}
  async throttle(ip: string, kind: string, limit: number) {
    const count = await this.db.serial(async (tx) => {
      const key = hash(`${kind}:${ip}`);
      await this.db.lock(tx, `rate:${key}`);
      const previous = await tx.rateLimit.findUnique({ where: { key } });
      return (
        await tx.rateLimit.upsert({
          where: { key },
          create: { key, count: 1, resetAt: new Date(Date.now() + 60000) },
          update:
            !previous || previous.resetAt <= new Date()
              ? { count: 1, resetAt: new Date(Date.now() + 60000) }
              : { count: { increment: 1 } },
        })
      ).count;
    });
    if (count > limit)
      fail(429, "RATE_LIMITED", "Too many attempts; try again in one minute");
  }
  async login(dto: LoginDto, ip: string) {
    if (
      this.config.get("PLATFORM_MODE", "demo") !== "demo" ||
      this.config.get("MOCK_AUTH_ENABLED", "true") !== "true"
    )
      fail(403, "FEATURE_DISABLED", "Demo authentication is disabled");
    await this.throttle(ip, "demo-login", 30);
    return this.db.serial(async (tx) => {
      const resumeSecret = dto.resumeSecret ?? secret();
      const identity = await tx.identity.findUnique({
        where: {
          provider_subject: { provider: "demo", subject: hash(resumeSecret) },
        },
      });
      let user;
      if (dto.resumeSecret) {
        if (!identity)
          fail(401, "UNAUTHORIZED", "Identity recovery proof is invalid");
        user = requireValue(
          await tx.user.findUnique({ where: { id: identity.userId } }),
        );
        if (user.status !== "normal")
          fail(403, "USER_FROZEN", "Account is unavailable");
      } else {
        user = await tx.user.create({
          data: {
            nickname: dto.nickname.trim(),
            invitationCode: secret().slice(0, 12).toUpperCase(),
          },
        });
        await tx.identity.create({
          data: {
            provider: "demo",
            subject: hash(resumeSecret),
            userId: user.id,
          },
        });
        await this.ledger.signup(tx, user.id);
        if (dto.ref) await this.bind(tx, user.id, dto.ref, false);
        user = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      }
      return {
        ...(await this.issue(tx, user.id, "user")),
        user: userView(user),
        resumeSecret,
      };
    });
  }
  async adminLogin(dto: AdminLoginDto, ip: string, requestId: string) {
    await this.throttle(ip, "admin-login", 10);
    const admin = await this.db.admin.findUnique({
      where: { username: dto.username },
    });
    if (
      !passwordMatches(dto.password, admin?.passwordHash ?? this.dummyHash) ||
      !admin?.enabled
    )
      fail(401, "UNAUTHORIZED", "Invalid administrator credentials");
    return this.db.serial(async (tx) => {
      const current = await tx.admin.findUniqueOrThrow({
        where: { id: admin.id },
      });
      if (!current.enabled || current.passwordHash !== admin.passwordHash)
        fail(401, "UNAUTHORIZED", "Administrator credentials changed");
      await tx.auditLog.create({
        data: {
          actor: current.id,
          action: "admin.login",
          target: current.id,
          reason: "Administrator session created",
          requestId,
        },
      });
      return {
        ...(await this.issue(tx, current.id, "admin")),
        admin: {
          id: current.id,
          username: current.username,
          role: current.role,
          entryIds: current.entryIds,
        },
      };
    });
  }
  private async issue(tx: Tx, subjectId: string, domain: "user" | "admin") {
    const expiresIn = Number(
      this.config.get(
        `JWT_${domain.toUpperCase()}_EXPIRES_IN_SECONDS`,
        domain === "user" ? 86400 : 28800,
      ),
    );
    const session = await tx.authSession.create({
      data: {
        subjectId,
        domain,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });
    const accessToken = await this.jwt.signAsync(
      { sub: subjectId, sid: session.id, tokenType: domain },
      {
        secret: this.config.getOrThrow(`JWT_${domain.toUpperCase()}_SECRET`),
        expiresIn,
        algorithm: "HS256",
        issuer: this.config.get("APP_DOMAIN", "tck666.cc"),
        audience: `tck-wins-${domain}`,
      },
    );
    return { accessToken, tokenType: "Bearer", expiresIn };
  }
  async me(actor: Actor) {
    if (actor.domain === "user")
      return {
        user: userView(
          requireValue(
            await this.db.user.findUnique({ where: { id: actor.id } }),
          ),
        ),
      };
    const admin = requireValue(
      await this.db.admin.findUnique({ where: { id: actor.id } }),
    );
    return {
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        entryIds: admin.entryIds,
      },
    };
  }
  async logout(actor: Actor) {
    await this.db.authSession.updateMany({
      where: { id: actor.sessionId, subjectId: actor.id },
      data: { revokedAt: new Date() },
    });
    return { loggedOut: true };
  }
  async bind(tx: Tx, userId: string, ref: string, strict = true) {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.inviterId) {
      if (strict) fail(409, "STATE_CONFLICT", "Invitation already bound");
      return;
    }
    const inviter = await tx.user.findUnique({
      where: { invitationCode: ref.trim().toUpperCase() },
    });
    if (!inviter || inviter.id === userId) {
      if (strict) fail(422, "VALIDATION_ERROR", "Invalid invitation code");
      return;
    }
    let current: string | null = inviter.id;
    for (let depth = 0; current; depth++) {
      if (current === userId || depth > 100)
        fail(409, "STATE_CONFLICT", "Invitation cycle is not allowed");
      current =
        (
          await tx.user.findUnique({
            where: { id: current },
            select: { inviterId: true },
          })
        )?.inviterId ?? null;
    }
    await tx.user.update({
      where: { id: userId },
      data: { inviterId: inviter.id },
    });
    await tx.invitation.create({
      data: { inviterId: inviter.id, inviteeId: userId },
    });
  }
}
