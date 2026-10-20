import { PrismaService } from "../prisma/prisma.service";
import { GamesService } from "../games/games.service";
export declare class WorkerService {
    private readonly db;
    private readonly games;
    readonly id: `${string}-${string}-${string}-${string}-${string}`;
    private readonly logger;
    constructor(db: PrismaService, games: GamesService);
    tick(): Promise<number>;
    publish(): Promise<number>;
}
