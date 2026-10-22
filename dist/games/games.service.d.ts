import { PrismaService, type Tx } from "../prisma/prisma.service";
import { LedgerService } from "../assets/ledger.service";
import { EventsService } from "../jobs/events.service";
import type { FighterDto } from "../common/dto";
export declare class GamesService {
    private readonly db;
    private readonly ledger;
    private readonly events;
    constructor(db: PrismaService, ledger: LedgerService, events: EventsService);
    private active;
    quote(tx: Tx, userId: string, gameId: string, choice: string): Promise<{
        quote: {
            amountAtomic: string;
            decimals: number;
            maximumPayoutAtomic: string;
            id: string;
            createdAt: Date;
            userId: string;
            expiresAt: Date;
            assetId: string;
            gameId: string;
            choice: string;
            ruleVersion: number;
            consumedBy: string | null;
        };
    }>;
    start(tx: Tx, userId: string, gameId: string, quoteId: string): Promise<{
        session: {
            id: string;
            userId: string;
            gameId: string;
            choice: string;
            outcome: string;
            won: boolean;
            status: string;
            amountAtomic: string;
            payoutAtomic: string;
            assetId: string;
            readyAt: number;
            createdAt: string;
            version: number;
            platformMode: string;
            dataSource: string;
            actorType: string;
            ruleVersion: number;
            resultHash: string | undefined;
            engineVersion: string;
        };
    }>;
    createFighter(tx: Tx, userId: string, dto?: FighterDto, retryId?: string): Promise<{
        fighter: {
            readyAt: number;
            createdAt: string;
            name: string;
            id: string;
            status: string;
            platformMode: string;
            dataSource: string;
            actorType: string;
            userId: string;
            version: number;
            style: string;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
            simulateFailure: boolean;
            refunded: boolean;
        };
    }>;
    fight(tx: Tx, userId: string, fighterId: string): Promise<{
        fight: {
            id: string;
            userId: string;
            fighterId: string;
            opponent: string;
            status: string;
            won: boolean;
            readyAt: number;
            createdAt: string;
            version: number;
            platformMode: string;
            dataSource: string;
            actorType: string;
            resultHash: string | undefined;
            assetId: string;
            payoutAtomic: string;
        };
    }>;
    finish(tx: Tx, type: string, entityId: string, businessKey: string, failed?: boolean): Promise<void>;
}
