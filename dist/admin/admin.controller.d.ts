import type { ApiRequest } from "../auth/types";
import { PrismaService } from "../prisma/prisma.service";
import { QuestsService } from "../quests/quests.service";
import { QueryService } from "../queries/query.service";
import { AdminService } from "./admin.service";
import { BudgetDto, ListQuery, PointsDto, QuestDto, ReviewDto, SettingsDto, StatusDto, UserStatusDto } from "../common/dto";
export declare class AdminController {
    private readonly db;
    private readonly admin;
    private readonly quests;
    private readonly queries;
    constructor(db: PrismaService, admin: AdminService, quests: QuestsService, queries: QueryService);
    private write;
    overview(): Promise<{
        users: number;
        rounds: number;
        pending: number;
        issued: number;
    }>;
    users(q: ListQuery): Promise<{
        items: {
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
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    user(id: string): Promise<{
        records: {
            history: {
                proof: string;
                reason: string | null;
                submittedAt: Date;
                action: string | null;
            }[];
            rewardGrantId: string | undefined;
            rewardAmount: string;
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            version: number;
            questId: string;
            periodKey: string;
            proof: string;
            rejectReason: string | null;
            questVersion: number;
            submittedAt: Date;
        }[];
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
            version: number;
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
    questsList(r: ApiRequest, q: ListQuery): Promise<{
        items: {
            rewardAmount: string;
            rewardType: string;
            userStatus: string;
            id: string;
            status: string;
            createdAt: Date;
            version: number;
            description: import("@prisma/client/runtime/client").JsonValue;
            entryId: string;
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
    records(r: ApiRequest, q: ListQuery): Promise<{
        items: {
            history: {
                proof: string;
                reason: string | null;
                submittedAt: Date;
                action: string | null;
            }[];
            rewardGrantId: string | undefined;
            rewardAmount: string;
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            version: number;
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
    getBudget(id: string, r: ApiRequest): Promise<{
        questId: string;
        availableAtomic: string;
        assetId: string;
    }>;
    templates(): {
        items: {
            id: string;
            type: string;
            reviewMode: string;
        }[];
    };
    points(q: ListQuery): Promise<{
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
    settings(): Promise<{
        version: number;
        maintenance: boolean;
        gameCostAtomic: string;
        maxFighters: number;
    }>;
    games(r: ApiRequest, q: ListQuery): Promise<{
        items: {
            costAtomic: string;
            name: string;
            id: string;
            status: string;
            chainId: string;
            version: number;
            slug: string;
            description: import("@prisma/client/runtime/client").JsonValue;
            kind: string;
            assetId: string;
            entryId: string;
            mode: string;
            color: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            amountAtomic: string;
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            assetId: string;
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
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
            version: number;
            style: string;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
            simulateFailure: boolean;
            refunded: boolean;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            actor: string;
            action: string;
            target: string;
            reason: string;
            requestId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            source: string;
            checksum: string;
            rowCount: number;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string | null;
            sourceSystem: string;
            sourceId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            type: string;
            attempt: number;
            businessKey: string;
            entityId: string;
            runAt: Date;
            leaseUntil: Date | null;
            leaseOwner: string | null;
            lastError: string | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            userId: string;
            type: string;
            eventKey: string;
            entityId: string;
            entityVersion: number;
            payload: import("@prisma/client/runtime/client").JsonValue;
            publishedAt: Date | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            nickname: string;
            inviterId: string | null;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        enabled: boolean;
        stage: string;
        items: never[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    activity(r: ApiRequest, q: ListQuery): Promise<{
        items: {
            costAtomic: string;
            name: string;
            id: string;
            status: string;
            chainId: string;
            version: number;
            slug: string;
            description: import("@prisma/client/runtime/client").JsonValue;
            kind: string;
            assetId: string;
            entryId: string;
            mode: string;
            color: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            amountAtomic: string;
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            assetId: string;
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
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
            version: number;
            style: string;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
            simulateFailure: boolean;
            refunded: boolean;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            actor: string;
            action: string;
            target: string;
            reason: string;
            requestId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            source: string;
            checksum: string;
            rowCount: number;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string | null;
            sourceSystem: string;
            sourceId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            type: string;
            attempt: number;
            businessKey: string;
            entityId: string;
            runAt: Date;
            leaseUntil: Date | null;
            leaseOwner: string | null;
            lastError: string | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            userId: string;
            type: string;
            eventKey: string;
            entityId: string;
            entityVersion: number;
            payload: import("@prisma/client/runtime/client").JsonValue;
            publishedAt: Date | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            nickname: string;
            inviterId: string | null;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        enabled: boolean;
        stage: string;
        items: never[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    rewards(r: ApiRequest, q: ListQuery): Promise<{
        items: {
            costAtomic: string;
            name: string;
            id: string;
            status: string;
            chainId: string;
            version: number;
            slug: string;
            description: import("@prisma/client/runtime/client").JsonValue;
            kind: string;
            assetId: string;
            entryId: string;
            mode: string;
            color: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            amountAtomic: string;
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            assetId: string;
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
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
            version: number;
            style: string;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
            simulateFailure: boolean;
            refunded: boolean;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            actor: string;
            action: string;
            target: string;
            reason: string;
            requestId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            source: string;
            checksum: string;
            rowCount: number;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string | null;
            sourceSystem: string;
            sourceId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            type: string;
            attempt: number;
            businessKey: string;
            entityId: string;
            runAt: Date;
            leaseUntil: Date | null;
            leaseOwner: string | null;
            lastError: string | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            userId: string;
            type: string;
            eventKey: string;
            entityId: string;
            entityVersion: number;
            payload: import("@prisma/client/runtime/client").JsonValue;
            publishedAt: Date | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            nickname: string;
            inviterId: string | null;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        enabled: boolean;
        stage: string;
        items: never[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    audit(r: ApiRequest, q: ListQuery): Promise<{
        items: {
            costAtomic: string;
            name: string;
            id: string;
            status: string;
            chainId: string;
            version: number;
            slug: string;
            description: import("@prisma/client/runtime/client").JsonValue;
            kind: string;
            assetId: string;
            entryId: string;
            mode: string;
            color: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            amountAtomic: string;
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            assetId: string;
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
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
            version: number;
            style: string;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
            simulateFailure: boolean;
            refunded: boolean;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            actor: string;
            action: string;
            target: string;
            reason: string;
            requestId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            source: string;
            checksum: string;
            rowCount: number;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string | null;
            sourceSystem: string;
            sourceId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            type: string;
            attempt: number;
            businessKey: string;
            entityId: string;
            runAt: Date;
            leaseUntil: Date | null;
            leaseOwner: string | null;
            lastError: string | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            userId: string;
            type: string;
            eventKey: string;
            entityId: string;
            entityVersion: number;
            payload: import("@prisma/client/runtime/client").JsonValue;
            publishedAt: Date | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            nickname: string;
            inviterId: string | null;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        enabled: boolean;
        stage: string;
        items: never[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    invitations(r: ApiRequest, q: ListQuery): Promise<{
        items: {
            costAtomic: string;
            name: string;
            id: string;
            status: string;
            chainId: string;
            version: number;
            slug: string;
            description: import("@prisma/client/runtime/client").JsonValue;
            kind: string;
            assetId: string;
            entryId: string;
            mode: string;
            color: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            amountAtomic: string;
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            assetId: string;
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
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
            version: number;
            style: string;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
            simulateFailure: boolean;
            refunded: boolean;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            actor: string;
            action: string;
            target: string;
            reason: string;
            requestId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            source: string;
            checksum: string;
            rowCount: number;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string | null;
            sourceSystem: string;
            sourceId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            type: string;
            attempt: number;
            businessKey: string;
            entityId: string;
            runAt: Date;
            leaseUntil: Date | null;
            leaseOwner: string | null;
            lastError: string | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            userId: string;
            type: string;
            eventKey: string;
            entityId: string;
            entityVersion: number;
            payload: import("@prisma/client/runtime/client").JsonValue;
            publishedAt: Date | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            nickname: string;
            inviterId: string | null;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        enabled: boolean;
        stage: string;
        items: never[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    leaderboard(q: ListQuery): Promise<{
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
    legacy(r: ApiRequest, q: ListQuery): Promise<{
        items: {
            costAtomic: string;
            name: string;
            id: string;
            status: string;
            chainId: string;
            version: number;
            slug: string;
            description: import("@prisma/client/runtime/client").JsonValue;
            kind: string;
            assetId: string;
            entryId: string;
            mode: string;
            color: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            amountAtomic: string;
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            assetId: string;
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
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
            version: number;
            style: string;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
            simulateFailure: boolean;
            refunded: boolean;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            actor: string;
            action: string;
            target: string;
            reason: string;
            requestId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            source: string;
            checksum: string;
            rowCount: number;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string | null;
            sourceSystem: string;
            sourceId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            type: string;
            attempt: number;
            businessKey: string;
            entityId: string;
            runAt: Date;
            leaseUntil: Date | null;
            leaseOwner: string | null;
            lastError: string | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            userId: string;
            type: string;
            eventKey: string;
            entityId: string;
            entityVersion: number;
            payload: import("@prisma/client/runtime/client").JsonValue;
            publishedAt: Date | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            nickname: string;
            inviterId: string | null;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        enabled: boolean;
        stage: string;
        items: never[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    jobs(r: ApiRequest, q: ListQuery): Promise<{
        items: {
            costAtomic: string;
            name: string;
            id: string;
            status: string;
            chainId: string;
            version: number;
            slug: string;
            description: import("@prisma/client/runtime/client").JsonValue;
            kind: string;
            assetId: string;
            entryId: string;
            mode: string;
            color: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            amountAtomic: string;
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            assetId: string;
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
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
            version: number;
            style: string;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
            simulateFailure: boolean;
            refunded: boolean;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            actor: string;
            action: string;
            target: string;
            reason: string;
            requestId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            source: string;
            checksum: string;
            rowCount: number;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string | null;
            sourceSystem: string;
            sourceId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            type: string;
            attempt: number;
            businessKey: string;
            entityId: string;
            runAt: Date;
            leaseUntil: Date | null;
            leaseOwner: string | null;
            lastError: string | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            userId: string;
            type: string;
            eventKey: string;
            entityId: string;
            entityVersion: number;
            payload: import("@prisma/client/runtime/client").JsonValue;
            publishedAt: Date | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            nickname: string;
            inviterId: string | null;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        enabled: boolean;
        stage: string;
        items: never[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    disabled(r: ApiRequest, q: ListQuery): Promise<{
        items: {
            costAtomic: string;
            name: string;
            id: string;
            status: string;
            chainId: string;
            version: number;
            slug: string;
            description: import("@prisma/client/runtime/client").JsonValue;
            kind: string;
            assetId: string;
            entryId: string;
            mode: string;
            color: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            amountAtomic: string;
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            assetId: string;
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
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
            version: number;
            style: string;
            power: number;
            speed: number;
            defense: number;
            attempt: number;
            simulateFailure: boolean;
            refunded: boolean;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
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
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            actor: string;
            action: string;
            target: string;
            reason: string;
            requestId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            source: string;
            checksum: string;
            rowCount: number;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string | null;
            sourceSystem: string;
            sourceId: string;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string;
            type: string;
            attempt: number;
            businessKey: string;
            entityId: string;
            runAt: Date;
            leaseUntil: Date | null;
            leaseOwner: string | null;
            lastError: string | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            createdAt: Date;
            userId: string;
            type: string;
            eventKey: string;
            entityId: string;
            entityVersion: number;
            payload: import("@prisma/client/runtime/client").JsonValue;
            publishedAt: Date | null;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        items: {
            id: string;
            nickname: string;
            inviterId: string | null;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    } | {
        enabled: boolean;
        stage: string;
        items: never[];
        pagination: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    create(dto: QuestDto, r: ApiRequest, key?: string): Promise<{
        quest: {
            rewardAmount: string;
            rewardType: string;
            userStatus: string;
            id: string;
            status: string;
            createdAt: Date;
            version: number;
            description: import("@prisma/client/runtime/client").JsonValue;
            entryId: string;
            type: string;
            title: import("@prisma/client/runtime/client").JsonValue;
            reviewMode: string;
            startTime: Date;
            endTime: Date;
        };
    }>;
    edit(id: string, dto: QuestDto, r: ApiRequest, key?: string): Promise<{
        quest: {
            rewardAmount: string;
            rewardType: string;
            userStatus: string;
            id: string;
            status: string;
            createdAt: Date;
            version: number;
            description: import("@prisma/client/runtime/client").JsonValue;
            entryId: string;
            type: string;
            title: import("@prisma/client/runtime/client").JsonValue;
            reviewMode: string;
            startTime: Date;
            endTime: Date;
        };
    }>;
    status(id: string, dto: StatusDto, r: ApiRequest, key?: string): Promise<{
        quest: {
            rewardAmount: string;
            rewardType: string;
            userStatus: string;
            id: string;
            status: string;
            createdAt: Date;
            version: number;
            description: import("@prisma/client/runtime/client").JsonValue;
            entryId: string;
            type: string;
            title: import("@prisma/client/runtime/client").JsonValue;
            reviewMode: string;
            startTime: Date;
            endTime: Date;
        };
    }>;
    review(id: string, dto: ReviewDto, r: ApiRequest, key?: string): Promise<{
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
            status: string;
            createdAt: Date;
            userId: string;
            version: number;
            questId: string;
            periodKey: string;
            proof: string;
            rejectReason: string | null;
            questVersion: number;
            submittedAt: Date;
        };
    }>;
    adjust(dto: PointsDto, r: ApiRequest, key?: string): Promise<{
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
        reason: string;
    }>;
    budget(id: string, dto: BudgetDto, r: ApiRequest, key?: string): Promise<{
        questId: string;
        availableAtomic: string;
    }>;
    settingsUpdate(dto: SettingsDto, r: ApiRequest, key?: string): Promise<{
        version: number;
        maintenance: boolean;
        gameCostAtomic: string;
        maxFighters: number;
    }>;
    freeze(id: string, dto: UserStatusDto, r: ApiRequest, key?: string): Promise<{
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
}
