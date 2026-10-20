import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Access } from "../auth/guard";
import type { ApiRequest } from "../auth/types";
import { PrismaService, type Tx } from "../prisma/prisma.service";
import { QuestsService } from "../quests/quests.service";
import { QueryService } from "../queries/query.service";
import { AdminService } from "./admin.service";
import {
  BudgetDto,
  ListQuery,
  PointsDto,
  QuestDto,
  ReviewDto,
  SettingsDto,
  StatusDto,
  UserStatusDto,
} from "../common/dto";
import { requireValue } from "../common/errors";
import { userView } from "../common/views";
@ApiTags("Administration")
@ApiBearerAuth()
@Access("admin")
@Controller("admin")
export class AdminController {
  constructor(
    private readonly db: PrismaService,
    private readonly admin: AdminService,
    private readonly quests: QuestsService,
    private readonly queries: QueryService,
  ) {}
  private write<T>(
    r: ApiRequest,
    key: string | undefined,
    dto: object,
    target: string,
    reason: string,
    work: (tx: Tx) => Promise<T>,
  ) {
    const action = `${r.method} ${r.path}`;
    return this.db.command(r.actor!, action, key, dto, async (tx) => {
      const result = await work(tx);
      await this.admin.audit(tx, r.actor!, action, target, reason, r.requestId);
      return result;
    });
  }
  @Access("admin", "overview.read") @Get("overview") overview() {
    return this.admin.overview();
  }
  @Access("admin", "users.read") @Get("users") users(@Query() q: ListQuery) {
    return this.admin.users(q);
  }
  @Access("admin", "users.read") @Get("users/:id") user(
    @Param("id") id: string,
  ) {
    return this.admin.user(id);
  }
  @Access("admin", "quests.read") @Get("quests") questsList(
    @Req() r: ApiRequest,
    @Query() q: ListQuery,
  ) {
    return this.admin.questList(r.actor!, q);
  }
  @Access("admin", "quests.read") @Get("quest-records") records(
    @Req() r: ApiRequest,
    @Query() q: ListQuery,
  ) {
    return this.admin.recordList(r.actor!, q);
  }
  @Access("admin", "quests.read") @Get("quests/:id/budget") getBudget(
    @Param("id") id: string,
    @Req() r: ApiRequest,
  ) {
    return this.admin.getBudget(r.actor!, id);
  }
  @Access("admin", "quests.read") @Get("quest-templates") templates() {
    return {
      items: [
        { id: "daily", type: "daily", reviewMode: "auto" },
        { id: "game", type: "game", reviewMode: "manual" },
        { id: "social", type: "social", reviewMode: "manual" },
      ],
    };
  }
  @Access("admin", "ledger.read") @Get("points/logs") points(
    @Query() q: ListQuery,
  ) {
    return this.admin.points(q);
  }
  @Access("admin", "settings.read") @Get("settings") settings() {
    return this.admin.settings();
  }
  @Access("admin", "catalog.read") @Get("games") games(
    @Req() r: ApiRequest,
    @Query() q: ListQuery,
  ) {
    return this.admin.resources("games", r.actor!, q);
  }
  @Access("admin", "activity.read")
  @Get(["game-sessions", "fighters", "fights"])
  activity(@Req() r: ApiRequest, @Query() q: ListQuery) {
    return this.admin.resources(r.path.split("/").at(-1)!, r.actor!, q);
  }
  @Access("admin", "rewards.read") @Get("rewards/batches") rewards(
    @Req() r: ApiRequest,
    @Query() q: ListQuery,
  ) {
    return this.admin.resources("rewards/batches", r.actor!, q);
  }
  @Access("admin", "audit.read") @Get("audit-logs") audit(
    @Req() r: ApiRequest,
    @Query() q: ListQuery,
  ) {
    return this.admin.resources("audit-logs", r.actor!, q);
  }
  @Access("admin", "users.read") @Get("invitations") invitations(
    @Req() r: ApiRequest,
    @Query() q: ListQuery,
  ) {
    return this.admin.resources("invitations", r.actor!, q);
  }
  @Access("admin", "users.read") @Get("leaderboards") leaderboard(
    @Query() q: ListQuery,
  ) {
    return this.queries.leaderboard(q.type ?? "points", q);
  }
  @Access("admin", "legacy.read")
  @Get(["import-batches", "legacy-identities"])
  legacy(@Req() r: ApiRequest, @Query() q: ListQuery) {
    return this.admin.resources(r.path.split("/").at(-1)!, r.actor!, q);
  }
  @Access("admin", "jobs.read") @Get(["jobs", "outbox"]) jobs(
    @Req() r: ApiRequest,
    @Query() q: ListQuery,
  ) {
    return this.admin.resources(r.path.split("/").at(-1)!, r.actor!, q);
  }
  @Access("admin", "rewards.read")
  @Get([
    "orders",
    "settlements",
    "tournaments",
    "noova/configs",
    "noova/instances",
    "noova/managers",
    "noova/stats",
  ])
  disabled(@Req() r: ApiRequest, @Query() q: ListQuery) {
    return this.admin.resources(
      r.path.replace(/^.*\/admin\//, ""),
      r.actor!,
      q,
    );
  }
  @Access("admin", "quests.write") @Post("quests") create(
    @Body() dto: QuestDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.write(r, key, dto, "new quest", "Create quest", (tx) =>
      this.admin.editQuest(tx, r.actor!, dto),
    );
  }
  @Access("admin", "quests.write") @Patch("quests/:id") edit(
    @Param("id") id: string,
    @Body() dto: QuestDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.write(r, key, dto, id, "Edit quest", (tx) =>
      this.admin.editQuest(tx, r.actor!, dto, id),
    );
  }
  @Access("admin", "quests.write") @Patch("quests/:id/status") status(
    @Param("id") id: string,
    @Body() dto: StatusDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.write(r, key, dto, id, "Change quest status", (tx) =>
      this.admin.questStatus(tx, r.actor!, id, dto),
    );
  }
  @Access("admin", "quests.write") @Post("quest-records/:id/review") review(
    @Param("id") id: string,
    @Body() dto: ReviewDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.write(r, key, dto, id, dto.reason ?? dto.action, (tx) =>
      this.quests.review(tx, r.actor!, id, dto),
    );
  }
  @Access("admin", "rewards.write") @Post("points/adjust") adjust(
    @Body() dto: PointsDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.write(r, key, dto, dto.userId, dto.reason, (tx) =>
      this.admin.adjust(tx, dto),
    );
  }
  @Access("admin", "rewards.write") @Post("quests/:id/budget") budget(
    @Param("id") id: string,
    @Body() dto: BudgetDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.write(r, key, dto, id, dto.reason, (tx) =>
      this.admin.addBudget(tx, id, dto),
    );
  }
  @Access("admin", "settings.write") @Patch("settings") settingsUpdate(
    @Body() dto: SettingsDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.write(
      r,
      key,
      dto,
      "global",
      "Update configuration version",
      (tx) => this.admin.saveSettings(tx, r.actor!, dto),
    );
  }
  @Access("admin", "users.write") @Patch("users/:id/status") freeze(
    @Param("id") id: string,
    @Body() dto: UserStatusDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.write(r, key, dto, id, dto.reason, async (tx) => {
      requireValue(await tx.user.findUnique({ where: { id } }));
      const user = await tx.user.update({
        where: { id },
        data: { status: dto.status },
      });
      if (dto.status === "frozen")
        await tx.authSession.updateMany({
          where: { subjectId: id, domain: "user", revokedAt: null },
          data: { revokedAt: new Date() },
        });
      return { user: userView(user) };
    });
  }
}
