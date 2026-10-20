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
import { Access } from "./auth/guard";
import type { ApiRequest } from "./auth/types";
import { AuthService } from "./auth/auth.service";
import { PrismaService } from "./prisma/prisma.service";
import { QueryService } from "./queries/query.service";
import { GamesService } from "./games/games.service";
import { QuestsService } from "./quests/quests.service";
import {
  BindDto,
  EmptyDto,
  FighterDto,
  FightDto,
  ListQuery,
  ProfileDto,
  ProofDto,
  QuoteDto,
  ReadAllDto,
  SessionDto,
} from "./common/dto";
import { fail, requireValue } from "./common/errors";
import { userView } from "./common/views";
@ApiTags("Public")
@Controller()
export class PublicController {
  constructor(
    private readonly queries: QueryService,
    private readonly db: PrismaService,
  ) {}
  @Access("public") @Get("health") health() {
    return {
      status: "ok",
      service: "tck-wins-backend",
      time: new Date().toISOString(),
    };
  }
  @Access("public") @Get("health/ready") async ready() {
    await this.db.$queryRaw`SELECT 1`;
    const worker = await this.db.workerHeartbeat.findFirst({
      where: { at: { gt: new Date(Date.now() - 30000) } },
    });
    const initialized = await this.db.setting.findUnique({
      where: { id: "global" },
    });
    if (!initialized || !worker)
      fail(503, "NOT_READY", "Database seed or Worker is not ready");
    return { status: "ready", database: true, worker: true };
  }
  @Access("public") @Get("public/config") config() {
    return this.queries.publicConfig();
  }
  @Access("public") @Get("public/home-summary") home() {
    return this.queries.home();
  }
  @Access("public") @Get("public/site-content") content() {
    return {
      siteName: "TCK Wins",
      siteUrl: "https://tck666.cc",
      source: "demo",
      communityLinks: [],
      announcement: "TCK Wins demo · No real funds",
    };
  }
  @Access("public") @Get("public/enums") enums() {
    return {
      questTypes: ["daily", "game", "social"],
      gameKinds: ["coin_flip", "claw_machine", "cash_or_crash", "grid_run"],
      assets: ["SSC", "IP", "POINTS", "TICKET"],
      source: "demo",
    };
  }
  @Access("public") @Get("games") games(@Query() q: ListQuery) {
    return this.queries.games(q);
  }
  @Access("public") @Get("games/:id") game(@Param("id") id: string) {
    return this.queries.game(id);
  }
  @Access("public") @Get("live-wins") wins(@Query() q: ListQuery) {
    return this.queries.wins(q);
  }
  @Access("optional") @Get("quests") quests(
    @Req() r: ApiRequest,
    @Query() q: ListQuery,
  ) {
    return this.queries.questList(r.actor?.id, q);
  }
  @Access("optional") @Get("quests/:id") quest(
    @Req() r: ApiRequest,
    @Param("id") id: string,
  ) {
    return this.queries.quest(r.actor?.id, id);
  }
  @Access("public") @Get("membership/levels") levels() {
    return this.queries.levels();
  }
  @Access("public") @Get("leaderboards/:type") leaderboard(
    @Param("type") type: string,
    @Query() q: ListQuery,
  ) {
    return this.queries.leaderboard(type, q);
  }
  @Access("public") @Get(["tournaments", "tournaments/:id"]) tournaments() {
    return { items: [], enabled: false, stage: "P1" };
  }
}
@ApiTags("User")
@ApiBearerAuth()
@Access("user")
@Controller()
export class UserController {
  constructor(
    private readonly db: PrismaService,
    private readonly auth: AuthService,
    private readonly queries: QueryService,
    private readonly games: GamesService,
    private readonly quests: QuestsService,
  ) {}
  @Get("users/me") me(@Req() r: ApiRequest) {
    return this.auth.me(r.actor!);
  }
  @Get("dashboard/me") dashboard(@Req() r: ApiRequest) {
    return this.queries.dashboard(r.actor!.id);
  }
  @Get("assets/me") assets(@Req() r: ApiRequest) {
    return this.queries.assets(r.actor!.id);
  }
  @Get("assets/me/ledger") ledger(@Req() r: ApiRequest, @Query() q: ListQuery) {
    return this.queries.ledgerList(r.actor!.id, q);
  }
  @Get("tickets/me") tickets(@Req() r: ApiRequest, @Query() q: ListQuery) {
    return this.queries.ledgerList(r.actor!.id, q, true);
  }
  @Get("game-sessions/me") sessions(
    @Req() r: ApiRequest,
    @Query() q: ListQuery,
  ) {
    return this.queries.sessions(r.actor!.id, q);
  }
  @Get("game-sessions/:id") session(
    @Req() r: ApiRequest,
    @Param("id") id: string,
  ) {
    return this.queries.session(r.actor!.id, id);
  }
  @Get("fighters/me") fighters(@Req() r: ApiRequest) {
    return this.queries.fighters(r.actor!.id);
  }
  @Get("fighters/:id") fighter(@Req() r: ApiRequest, @Param("id") id: string) {
    return this.queries.fighter(r.actor!.id, id);
  }
  @Get("fights/me") fights(@Req() r: ApiRequest, @Query() q: ListQuery) {
    return this.queries.fights(r.actor!.id, q);
  }
  @Get("fights/:id") fight(@Req() r: ApiRequest, @Param("id") id: string) {
    return this.queries.fight(r.actor!.id, id);
  }
  @Get("rewards/me") rewards(@Req() r: ApiRequest, @Query() q: ListQuery) {
    return this.queries.rewards(r.actor!.id, q);
  }
  @Get("notifications/unread-count") unread(@Req() r: ApiRequest) {
    return this.queries.unread(r.actor!.id);
  }
  @Get("notifications") notifications(
    @Req() r: ApiRequest,
    @Query() q: ListQuery,
  ) {
    return this.queries.notifications(r.actor!.id, q);
  }
  @Get("users/me/point-logs") points(
    @Req() r: ApiRequest,
    @Query() q: ListQuery,
  ) {
    return this.queries.pointLogs(r.actor!.id, q);
  }
  @Get("users/me/quest-records") records(
    @Req() r: ApiRequest,
    @Query() q: ListQuery,
  ) {
    return this.queries.records(r.actor!.id, q);
  }
  @Get("invitations/me") invites(@Req() r: ApiRequest, @Query() q: ListQuery) {
    return this.queries.invitations(r.actor!.id, q);
  }
  @Get("membership/me") membership(@Req() r: ApiRequest) {
    return this.queries.membership(r.actor!.id);
  }
  @Get("holdings/me") holdings(@Req() r: ApiRequest) {
    return this.queries.holdings(r.actor!.id);
  }
  @Patch("users/me") profile(
    @Body() dto: ProfileDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.db.command(
      r.actor!,
      "profile.update",
      key,
      dto,
      async (tx) => ({
        user: userView(
          await tx.user.update({
            where: { id: r.actor!.id },
            data: { nickname: dto.nickname.trim() },
          }),
        ),
      }),
    );
  }
  @Post("games/:id/quotes") quote(
    @Param("id") id: string,
    @Body() dto: QuoteDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.db.command(r.actor!, `game.quote:${id}`, key, dto, (tx) =>
      this.games.quote(tx, r.actor!.id, id, dto.choice),
    );
  }
  @Post("games/:id/sessions") play(
    @Param("id") id: string,
    @Body() dto: SessionDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.db.command(r.actor!, `game.play:${id}`, key, dto, (tx) =>
      this.games.start(tx, r.actor!.id, id, dto.quoteId),
    );
  }
  @Post("game-sessions/:id/actions") actions() {
    fail(
      409,
      "STATE_CONFLICT",
      "Coin Flip has no user actions after confirmation",
    );
  }
  @Post("fighters") createFighter(
    @Body() dto: FighterDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.db.command(r.actor!, "fighter.create", key, dto, (tx) =>
      this.games.createFighter(tx, r.actor!.id, dto),
    );
  }
  @Post("fighters/:id/retry") retry(
    @Param("id") id: string,
    @Body() dto: EmptyDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.db.command(r.actor!, `fighter.retry:${id}`, key, dto, (tx) =>
      this.games.createFighter(tx, r.actor!.id, undefined, id),
    );
  }
  @Post("fights/queue") fightQueue(
    @Body() dto: FightDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.db.command(r.actor!, "fight.queue", key, dto, (tx) =>
      this.games.fight(tx, r.actor!.id, dto.fighterId),
    );
  }
  @Post("quests/:id/submit") submit(
    @Param("id") id: string,
    @Body() dto: ProofDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.db.command(r.actor!, `quest.submit:${id}`, key, dto, (tx) =>
      this.quests.submit(tx, r.actor!.id, id, dto.proof),
    );
  }
  @Post("quests/:id/claim") claimQuest(
    @Param("id") id: string,
    @Body() dto: EmptyDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.db.command(r.actor!, `quest.claim:${id}`, key, dto, (tx) =>
      this.quests.claim(tx, r.actor!.id, undefined, id),
    );
  }
  @Post("rewards/:id/claim") claimReward(
    @Param("id") id: string,
    @Body() dto: EmptyDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.db.command(r.actor!, `reward.claim:${id}`, key, dto, (tx) =>
      this.quests.claim(tx, r.actor!.id, id),
    );
  }
  @Patch("notifications/:id/read") read(
    @Param("id") id: string,
    @Body() dto: EmptyDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.db.command(
      r.actor!,
      `notification.read:${id}`,
      key,
      dto,
      async (tx) => {
        const n = requireValue(
          await tx.notification.findFirst({
            where: { id, userId: r.actor!.id },
          }),
        );
        return {
          notification: await tx.notification.update({
            where: { id },
            data: { readAt: n.readAt ?? new Date() },
          }),
        };
      },
    );
  }
  @Post("notifications/read-all") readAll(
    @Body() dto: ReadAllDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.db.command(
      r.actor!,
      "notification.readAll",
      key,
      dto,
      async (tx) => {
        const result = await tx.notification.updateMany({
          where: { id: { in: dto.ids }, userId: r.actor!.id, readAt: null },
          data: { readAt: new Date() },
        });
        return { read: true, count: result.count };
      },
    );
  }
  @Post("invitations/bind") bind(
    @Body() dto: BindDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.db.command(
      r.actor!,
      "invitation.bind",
      key,
      dto,
      async (tx) => {
        await this.auth.bind(tx, r.actor!.id, dto.ref);
        return { bound: true };
      },
    );
  }
  @Post("holdings/me/refresh") refreshHolding(
    @Body() dto: EmptyDto,
    @Req() r: ApiRequest,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.db.command(
      r.actor!,
      "holdings.refresh",
      key,
      dto,
      async (tx) => {
        const s = await tx.holdingSnapshot.create({
          data: { userId: r.actor!.id },
        });
        return { source: "demo", tckBalance: "0", syncedAt: s.createdAt };
      },
    );
  }
}
