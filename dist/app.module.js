"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const config_2 = require("./config");
const prisma_service_1 = require("./prisma/prisma.service");
const auth_service_1 = require("./auth/auth.service");
const auth_controller_1 = require("./auth/auth.controller");
const guard_1 = require("./auth/guard");
const ledger_service_1 = require("./assets/ledger.service");
const games_service_1 = require("./games/games.service");
const quests_service_1 = require("./quests/quests.service");
const events_service_1 = require("./jobs/events.service");
const worker_service_1 = require("./jobs/worker.service");
const query_service_1 = require("./queries/query.service");
const pagination_1 = require("./common/pagination");
const api_controller_1 = require("./api.controller");
const admin_service_1 = require("./admin/admin.service");
const admin_controller_1 = require("./admin/admin.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, validate: config_2.validateConfig }),
            jwt_1.JwtModule.register({}),
        ],
        controllers: [
            auth_controller_1.AuthController,
            api_controller_1.PublicController,
            api_controller_1.UserController,
            admin_controller_1.AdminController,
        ],
        providers: [
            prisma_service_1.PrismaService,
            auth_service_1.AuthService,
            ledger_service_1.LedgerService,
            games_service_1.GamesService,
            quests_service_1.QuestsService,
            events_service_1.EventsService,
            worker_service_1.WorkerService,
            query_service_1.QueryService,
            pagination_1.Cursors,
            admin_service_1.AdminService,
            { provide: core_1.APP_GUARD, useClass: guard_1.AuthGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map