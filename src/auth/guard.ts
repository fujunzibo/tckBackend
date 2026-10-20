import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import type { ApiRequest, Actor } from "./types";
import { PrismaService } from "../prisma/prisma.service";
import { fail } from "../common/errors";
export const Access = (
  domain: "public" | "optional" | "user" | "admin",
  permission = "",
) => SetMetadata("access", { domain, permission });
export const rolePermissions: Record<string, readonly string[]> = {
  system: ["*"],
  quest_operator: ["quests.read", "quests.write", "users.read"],
  reward_operator: [
    "quests.read",
    "rewards.read",
    "rewards.write",
    "users.read",
    "ledger.read",
  ],
  project_operator: ["catalog.read", "quests.read", "quests.write"],
  auditor: [
    "overview.read",
    "users.read",
    "catalog.read",
    "activity.read",
    "quests.read",
    "rewards.read",
    "ledger.read",
    "audit.read",
    "settings.read",
    "legacy.read",
    "jobs.read",
  ],
};
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly db: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const access = this.reflector.getAllAndOverride<{
      domain: string;
      permission: string;
    }>("access", [context.getHandler(), context.getClass()]) ?? {
      domain: "user",
      permission: "",
    };
    if (access.domain === "public") return true;
    const request = context.switchToHttp().getRequest<ApiRequest>();
    const bearer = /^Bearer (\S+)$/i.exec(
      request.headers.authorization ?? "",
    )?.[1];
    if (!bearer) {
      if (access.domain === "optional") return true;
      fail(401, "UNAUTHORIZED", "Please sign in");
    }
    const domain = access.domain === "admin" ? "admin" : "user";
    let claims: { sub?: string; sid?: string; tokenType?: string };
    try {
      claims = await this.jwt.verifyAsync(bearer, {
        secret: this.config.getOrThrow(`JWT_${domain.toUpperCase()}_SECRET`),
        algorithms: ["HS256"],
        issuer: this.config.get("APP_DOMAIN", "tck666.cc"),
        audience: `tck-wins-${domain}`,
      });
    } catch {
      fail(401, "UNAUTHORIZED", "Invalid or expired access token");
    }
    if (!claims.sub || !claims.sid || claims.tokenType !== domain)
      fail(401, "UNAUTHORIZED", "Invalid session domain");
    const actor: Actor = { id: claims.sub, sessionId: claims.sid, domain };
    if (domain === "admin") {
      const admin = await this.db.admin.findUnique({ where: { id: actor.id } });
      if (!admin?.enabled) fail(403, "FORBIDDEN", "Administrator is disabled");
      actor.role = admin.role;
      actor.entryIds = admin.entryIds;
      const permissions = rolePermissions[admin.role] ?? [];
      if (
        access.permission &&
        !permissions.includes("*") &&
        !permissions.includes(access.permission)
      )
        fail(403, "FORBIDDEN", "Permission denied");
    }
    await this.db.assertActor(this.db, actor);
    request.actor = actor;
    return true;
  }
}
