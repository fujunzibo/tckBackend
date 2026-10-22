import type { ApiRequest } from "./auth/types";
import { AuthService } from "./auth/auth.service";
import { PrismaService } from "./prisma/prisma.service";
import { QueryService } from "./queries/query.service";
import { GamesService } from "./games/games.service";
import { QuestsService } from "./quests/quests.service";
import { BindDto, EmptyDto, FighterDto, FightDto, ListQuery, ProfileDto, ProofDto, QuoteDto, ReadAllDto, SessionDto } from "./common/dto";
export declare class PublicController {
    private readonly queries;
    private readonly db;
    constructor(queries: QueryService, db: PrismaService);
    health(): {
        status: string;
        service: string;
        time: string;
    };
    ready(): Promise<{
        status: string;
        database: boolean;
        worker: boolean;
    }>;
    config(): Promise<{
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
            chainId: string;
            decimals: number;
            platformMode: string;
        }[];
        apiVersion: string;
        platformMode: string;
        text: {
            environment: import("./public-presentation").PublicCopy;
        };
        modes: {
            id: string;
            label: import("./public-presentation").PublicCopy;
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
    content(): {
        siteName: string;
        siteUrl: string;
        source: string;
        communityLinks: never[];
        announcement: string;
    };
    enums(): {
        questTypes: string[];
        gameKinds: string[];
        assets: string[];
        source: string;
    };
    games(q: ListQuery): Promise<{
        items: {
            costAtomic: string;
            id: string;
            name: string;
            version: number;
            slug: string;
            description: import("@prisma/client/runtime/client").JsonValue;
            kind: string;
            chainId: string;
            assetId: string;
            entryId: string;
            mode: string;
            status: string;
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
            id: string;
            name: string;
            version: number;
            slug: string;
            description: import("@prisma/client/runtime/client").JsonValue;
            kind: string;
            chainId: string;
            assetId: string;
            entryId: string;
            mode: string;
            status: string;
            color: string;
        };
    }>;
    wins(q: ListQuery): Promise<{
        items: {
            payoutAtomic: string;
            id: string;
            createdAt: Date;
            assetId: string;
            actorType: string;
            sessionId: string;
            gameId: string;
            nickname: string;
            source: string;
        }[];
        hasMore: boolean;
        nextCursor: string | null;
    }>;
    quests(r: ApiRequest, q: ListQuery): Promise<{
        items: {
            rewardAmount: string;
            rewardType: string;
            userStatus: string;
            id: string;
            createdAt: Date;
            version: number;
            description: import("@prisma/client/runtime/client").JsonValue;
            entryId: string;
            status: string;
            type: string;
            title: import("@prisma/client/runtime/client").JsonValue;
            reviewMode: string;
            startTime: Date;
            endTime: Date;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    quest(r: ApiRequest, id: string): Promise<{
        quest: {
            rewardAmount: string;
            rewardType: string;
            userStatus: string;
            id: string;
            createdAt: Date;
            version: number;
            description: import("@prisma/client/runtime/client").JsonValue;
            entryId: string;
            status: string;
            type: string;
            title: import("@prisma/client/runtime/client").JsonValue;
            reviewMode: string;
            startTime: Date;
            endTime: Date;
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
            version: number;
            status: string;
            userId: string;
            questId: string;
            periodKey: string;
            proof: string;
            rejectReason: string | null;
            questVersion: number;
            submittedAt: Date;
        } | null;
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
    tournaments(): {
        items: never[];
        enabled: boolean;
        stage: string;
    };
}
export declare class UserController {
    private readonly db;
    private readonly auth;
    private readonly queries;
    private readonly games;
    private readonly quests;
    constructor(db: PrismaService, auth: AuthService, queries: QueryService, games: GamesService, quests: QuestsService);
    me(r: ApiRequest): Promise<{
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
        admin?: undefined;
    } | {
        admin: {
            id: string;
            username: string;
            role: string;
            entryIds: string[];
        };
        user?: undefined;
    }>;
    dashboard(r: ApiRequest): Promise<{
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
            id: string;
            name: string;
            version: number;
            status: string;
            platformMode: string;
            actorType: string;
            userId: string;
            dataSource: string;
            style: string;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
            simulateFailure: boolean;
            refunded: boolean;
        }[];
        unread: number;
        completedQuests: number;
        claimable: number;
    }>;
    assets(r: ApiRequest): Promise<{
        items: {
            assetId: string;
            symbol: string;
            chainId: string;
            decimals: number;
            availableAtomic: string;
            lockedAtomic: string;
        }[];
    }>;
    ledger(r: ApiRequest, q: ListQuery): Promise<{
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
            createdAt: Date;
            userId: string;
            businessKey: string;
            remaining: number;
            locked: number;
            purpose: string;
            expiresAt: Date | null;
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
    tickets(r: ApiRequest, q: ListQuery): Promise<{
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
            createdAt: Date;
            userId: string;
            businessKey: string;
            remaining: number;
            locked: number;
            purpose: string;
            expiresAt: Date | null;
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
    sessions(r: ApiRequest, q: ListQuery): Promise<{
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
    session(r: ApiRequest, id: string): Promise<{
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
    fighters(r: ApiRequest): Promise<{
        items: {
            readyAt: number;
            createdAt: string;
            id: string;
            name: string;
            version: number;
            status: string;
            platformMode: string;
            actorType: string;
            userId: string;
            dataSource: string;
            style: string;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
            simulateFailure: boolean;
            refunded: boolean;
        }[];
        limit: number;
    }>;
    fighter(r: ApiRequest, id: string): Promise<{
        fighter: {
            readyAt: number;
            createdAt: string;
            id: string;
            name: string;
            version: number;
            status: string;
            platformMode: string;
            actorType: string;
            userId: string;
            dataSource: string;
            style: string;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
            simulateFailure: boolean;
            refunded: boolean;
        };
    }>;
    fights(r: ApiRequest, q: ListQuery): Promise<{
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
    fight(r: ApiRequest, id: string): Promise<{
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
    rewards(r: ApiRequest, q: ListQuery): Promise<{
        items: {
            amountAtomic: string;
            id: string;
            createdAt: Date;
            assetId: string;
            status: string;
            userId: string;
            title: import("@prisma/client/runtime/client").JsonValue;
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
    unread(r: ApiRequest): Promise<{
        count: number;
    }>;
    notifications(r: ApiRequest, q: ListQuery): Promise<{
        snapshotIds: string[];
        items: {
            id: string;
            createdAt: Date;
            type: string;
            userId: string;
            title: import("@prisma/client/runtime/client").JsonValue;
            readAt: Date | null;
            eventKey: string;
            body: import("@prisma/client/runtime/client").JsonValue;
            href: string;
        }[];
        hasMore: boolean;
        nextCursor: string | null;
    }>;
    points(r: ApiRequest, q: ListQuery): Promise<{
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
    records(r: ApiRequest, q: ListQuery): Promise<{
        items: {
            rewardAmount: string;
            history: unknown[];
            id: string;
            createdAt: Date;
            version: number;
            status: string;
            userId: string;
            questId: string;
            periodKey: string;
            proof: string;
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
    invites(r: ApiRequest, q: ListQuery): Promise<{
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
    membership(r: ApiRequest): Promise<{
        level: string;
        pointsExact: string;
        tckBalance: string;
        source: string;
    }>;
    holdings(r: ApiRequest): Promise<{
        balance: string;
        tckBalance: string;
        source: string;
        syncedAt: Date | null;
        items: {
            balance: string;
            id: string;
            createdAt: Date;
            chainId: string;
            source: string;
            userId: string;
        }[];
    }>;
    profile(dto: ProfileDto, r: ApiRequest, key?: string): Promise<{
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
    }>;
    quote(id: string, dto: QuoteDto, r: ApiRequest, key?: string): Promise<{
        quote: {
            amountAtomic: string;
            decimals: number;
            maximumPayoutAtomic: string;
            id: string;
            createdAt: Date;
            assetId: string;
            gameId: string;
            userId: string;
            choice: string;
            ruleVersion: number;
            expiresAt: Date;
            consumedBy: string | null;
        };
    }>;
    play(id: string, dto: SessionDto, r: ApiRequest, key?: string): Promise<{
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
    actions(): void;
    createFighter(dto: FighterDto, r: ApiRequest, key?: string): Promise<{
        fighter: {
            readyAt: number;
            createdAt: string;
            id: string;
            name: string;
            version: number;
            status: string;
            platformMode: string;
            actorType: string;
            userId: string;
            dataSource: string;
            style: string;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
            simulateFailure: boolean;
            refunded: boolean;
        };
    }>;
    retry(id: string, dto: EmptyDto, r: ApiRequest, key?: string): Promise<{
        fighter: {
            readyAt: number;
            createdAt: string;
            id: string;
            name: string;
            version: number;
            status: string;
            platformMode: string;
            actorType: string;
            userId: string;
            dataSource: string;
            style: string;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
            simulateFailure: boolean;
            refunded: boolean;
        };
    }>;
    fightQueue(dto: FightDto, r: ApiRequest, key?: string): Promise<{
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
    submit(id: string, dto: ProofDto, r: ApiRequest, key?: string): Promise<{
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
            version: number;
            status: string;
            userId: string;
            questId: string;
            periodKey: string;
            proof: string;
            rejectReason: string | null;
            questVersion: number;
            submittedAt: Date;
        };
    }>;
    claimQuest(id: string, dto: EmptyDto, r: ApiRequest, key?: string): Promise<{
        reward: {
            amountAtomic: string;
            id: string;
            createdAt: Date;
            assetId: string;
            status: string;
            userId: string;
            title: import("@prisma/client/runtime/client").JsonValue;
            questId: string;
            recordId: string;
            issuedAt: Date | null;
        };
    }>;
    claimReward(id: string, dto: EmptyDto, r: ApiRequest, key?: string): Promise<{
        reward: {
            amountAtomic: string;
            id: string;
            createdAt: Date;
            assetId: string;
            status: string;
            userId: string;
            title: import("@prisma/client/runtime/client").JsonValue;
            questId: string;
            recordId: string;
            issuedAt: Date | null;
        };
    }>;
    read(id: string, dto: EmptyDto, r: ApiRequest, key?: string): Promise<{
        notification: {
            id: string;
            createdAt: Date;
            type: string;
            userId: string;
            title: import("@prisma/client/runtime/client").JsonValue;
            readAt: Date | null;
            eventKey: string;
            body: import("@prisma/client/runtime/client").JsonValue;
            href: string;
        };
    }>;
    readAll(dto: ReadAllDto, r: ApiRequest, key?: string): Promise<{
        read: boolean;
        count: number;
    }>;
    bind(dto: BindDto, r: ApiRequest, key?: string): Promise<{
        bound: boolean;
    }>;
    refreshHolding(dto: EmptyDto, r: ApiRequest, key?: string): Promise<{
        source: string;
        tckBalance: string;
        syncedAt: Date;
    }>;
}
