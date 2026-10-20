import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LedgerService } from "../assets/ledger.service";
import { QuestsService } from "../quests/quests.service";
import { Cursors } from "../common/pagination";
import type { ListQuery } from "../common/dto";
export declare class QueryService {
    private readonly db;
    private readonly ledger;
    private readonly quests;
    private readonly cursors;
    constructor(db: PrismaService, ledger: LedgerService, quests: QuestsService, cursors: Cursors);
    publicConfig(): Promise<{
        features: {
            demoLogin: boolean;
            fighterFailureSimulation: boolean;
            rewardBudgets: boolean;
            payments: boolean;
            tournaments: boolean;
            noova: boolean;
        };
        assets: {
            symbol: string;
            id: string;
            platformMode: string;
            decimals: number;
            chainId: string;
        }[];
        apiVersion: string;
        platformMode: string;
        text: {
            environment: import("../public-presentation").PublicCopy;
        };
        modes: {
            id: string;
            label: import("../public-presentation").PublicCopy;
        }[];
        chains: {
            id: string;
            name: string;
        }[];
        gameKinds: {
            id: string;
            name: string;
        }[];
        gameAssets: string[];
        entries: {
            id: string;
            name: string;
        }[];
        catalog: {
            id: string;
            slug: string;
            name: string;
            mode: string;
        }[];
        fighterCreation: {
            amountAtomic: string;
            assetId: string;
        };
    }>;
    home(): Promise<{
        games: number;
        rounds: number;
        fighters: number;
        members: number;
        source: string;
    }>;
    games(q: ListQuery): Promise<{
        items: {
            costAtomic: string;
            name: string;
            id: string;
            status: string;
            assetId: string;
            kind: string;
            chainId: string;
            version: number;
            description: Prisma.JsonValue;
            entryId: string;
            slug: string;
            mode: string;
            color: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    game(id: string): Promise<{
        game: {
            costAtomic: string;
            name: string;
            id: string;
            status: string;
            assetId: string;
            kind: string;
            chainId: string;
            version: number;
            description: Prisma.JsonValue;
            entryId: string;
            slug: string;
            mode: string;
            color: string;
        };
    }>;
    wins(q: ListQuery): Promise<{
        items: {
            payoutAtomic: string;
            id: string;
            createdAt: Date;
            nickname: string;
            actorType: string;
            assetId: string;
            source: string;
            gameId: string;
            sessionId: string;
        }[];
        hasMore: boolean;
        nextCursor: string | null;
    }>;
    dashboard(userId: string): Promise<{
        user: {
            id: string;
            nickname: string;
            walletAddress: string;
            invitationCode: string;
            inviterId: string | undefined;
            pointsExact: string;
            level: string;
            status: string;
            createdAt: string;
            platformMode: string;
            dataSource: string;
            actorType: string;
        };
        assets: {
            assetId: string;
            symbol: string;
            chainId: string;
            decimals: number;
            availableAtomic: string;
            lockedAtomic: string;
        }[];
        sessions: {
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
        }[];
        fighters: {
            readyAt: number;
            createdAt: string;
            name: string;
            id: string;
            status: string;
            platformMode: string;
            dataSource: string;
            actorType: string;
            userId: string;
            refunded: boolean;
            style: string;
            simulateFailure: boolean;
            version: number;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
        }[];
        unread: number;
        completedQuests: number;
        claimable: number;
    }>;
    assets(userId: string): Promise<{
        items: {
            assetId: string;
            symbol: string;
            chainId: string;
            decimals: number;
            availableAtomic: string;
            lockedAtomic: string;
        }[];
    }>;
    ledgerList(userId: string, q: ListQuery, tickets?: boolean): Promise<{
        items: {
            id: string;
            userId: string | null;
            assetId: string;
            amountAtomic: string;
            reason: string;
            businessId: string;
            transactionId: string;
            createdAt: string;
        }[];
        hasMore: boolean;
        nextCursor: string | null;
    } | {
        balance: {
            assetId: string;
            symbol: string;
            chainId: string;
            decimals: number;
            availableAtomic: string;
            lockedAtomic: string;
        } | undefined;
        lots: {
            id: string;
            expiresAt: Date | null;
            createdAt: Date;
            userId: string;
            businessKey: string;
            remaining: number;
            locked: number;
            purpose: string;
        }[];
        items: {
            id: string;
            userId: string | null;
            assetId: string;
            amountAtomic: string;
            reason: string;
            businessId: string;
            transactionId: string;
            createdAt: string;
        }[];
        hasMore: boolean;
        nextCursor: string | null;
    }>;
    sessions(userId: string, q: ListQuery): Promise<{
        items: {
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
        }[];
        hasMore: boolean;
        nextCursor: string | null;
    }>;
    session(userId: string, id: string): Promise<{
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
    fighters(userId: string): Promise<{
        items: {
            readyAt: number;
            createdAt: string;
            name: string;
            id: string;
            status: string;
            platformMode: string;
            dataSource: string;
            actorType: string;
            userId: string;
            refunded: boolean;
            style: string;
            simulateFailure: boolean;
            version: number;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
        }[];
        limit: number;
    }>;
    fighter(userId: string, id: string): Promise<{
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
            refunded: boolean;
            style: string;
            simulateFailure: boolean;
            version: number;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
        };
    }>;
    fights(userId: string, q: ListQuery): Promise<{
        items: {
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
        }[];
        hasMore: boolean;
        nextCursor: string | null;
    }>;
    fight(userId: string, id: string): Promise<{
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
    questList(userId: string | undefined, q: ListQuery): Promise<{
        items: {
            rewardAmount: string;
            rewardType: string;
            userStatus: string;
            id: string;
            createdAt: Date;
            status: string;
            version: number;
            title: Prisma.JsonValue;
            description: Prisma.JsonValue;
            type: string;
            reviewMode: string;
            startTime: Date;
            endTime: Date;
            entryId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    quest(userId: string | undefined, id: string): Promise<{
        quest: {
            rewardAmount: string;
            rewardType: string;
            userStatus: string;
            id: string;
            createdAt: Date;
            status: string;
            version: number;
            title: Prisma.JsonValue;
            description: Prisma.JsonValue;
            type: string;
            reviewMode: string;
            startTime: Date;
            endTime: Date;
            entryId: string;
        };
        record: {
            history: {
                proof: string;
                reason: string | null;
                submittedAt: Date;
                action: string | null;
            }[];
            rewardGrantId: string | undefined;
            rewardAmount: string;
            id: string;
            createdAt: Date;
            status: string;
            userId: string;
            proof: string;
            version: number;
            questId: string;
            periodKey: string;
            rejectReason: string | null;
            questVersion: number;
            submittedAt: Date;
        } | null;
    }>;
    rewards(userId: string, q: ListQuery): Promise<{
        items: {
            amountAtomic: string;
            id: string;
            createdAt: Date;
            status: string;
            userId: string;
            assetId: string;
            title: Prisma.JsonValue;
            questId: string;
            recordId: string;
            issuedAt: Date | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    notifications(userId: string, q: ListQuery): Promise<{
        snapshotIds: string[];
        items: {
            id: string;
            createdAt: Date;
            userId: string;
            title: Prisma.JsonValue;
            type: string;
            eventKey: string;
            href: string;
            body: Prisma.JsonValue;
            readAt: Date | null;
        }[];
        hasMore: boolean;
        nextCursor: string | null;
    }>;
    unread(userId: string): Promise<{
        count: number;
    }>;
    pointLogs(userId: string, q: ListQuery): Promise<{
        items: {
            id: string;
            userId: string | null;
            assetId: string;
            amountAtomic: string;
            reason: string;
            businessId: string;
            transactionId: string;
            createdAt: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    records(userId: string, q: ListQuery): Promise<{
        items: {
            rewardAmount: string;
            history: unknown[];
            id: string;
            createdAt: Date;
            status: string;
            userId: string;
            proof: string;
            version: number;
            questId: string;
            periodKey: string;
            rejectReason: string | null;
            questVersion: number;
            submittedAt: Date;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    invitations(userId: string, q: ListQuery): Promise<{
        totalInvited: number;
        effectiveInvited: number;
        invitationUrl: string;
        items: {
            id: string;
            createdAt: Date;
            nickname: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    leaderboard(type: string, q: ListQuery): Promise<{
        source: string;
        period: string;
        items: {
            rank: number;
            id: string;
            nickname: string;
            level: string;
            value: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    levels(): {
        items: ({
            level: string;
            points: string;
        } | {
            level: string;
            points: null;
        })[];
    };
    membership(userId: string): Promise<{
        level: string;
        pointsExact: string;
        tckBalance: string;
        source: string;
    }>;
    holdings(userId: string): Promise<{
        balance: string;
        tckBalance: string;
        source: string;
        syncedAt: Date | null;
        items: {
            balance: string;
            id: string;
            createdAt: Date;
            userId: string;
            chainId: string;
            source: string;
        }[];
    }>;
}
