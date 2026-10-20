import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { validateConfig } from "./config";
import { PrismaService } from "./prisma/prisma.service";
import { AuthService } from "./auth/auth.service";
import { AuthController } from "./auth/auth.controller";
import { AuthGuard } from "./auth/guard";
import { LedgerService } from "./assets/ledger.service";
import { GamesService } from "./games/games.service";
import { QuestsService } from "./quests/quests.service";
import { EventsService } from "./jobs/events.service";
import { WorkerService } from "./jobs/worker.service";
import { QueryService } from "./queries/query.service";
import { Cursors } from "./common/pagination";
import { PublicController, UserController } from "./api.controller";
import { AdminService } from "./admin/admin.service";
import { AdminController } from "./admin/admin.controller";
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateConfig }),
    JwtModule.register({}),
  ],
  controllers: [
    AuthController,
    PublicController,
    UserController,
    AdminController,
  ],
  providers: [
    PrismaService,
    AuthService,
    LedgerService,
    GamesService,
    QuestsService,
    EventsService,
    WorkerService,
    QueryService,
    Cursors,
    AdminService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
