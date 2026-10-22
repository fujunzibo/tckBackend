import { Prisma } from "@prisma/client";
import { PrismaService, type Tx } from "../prisma/prisma.service";
import { LedgerService } from "../assets/ledger.service";
import { QuestsService } from "../quests/quests.service";
import { QueryService } from "../queries/query.service";
import type { Actor } from "../auth/types";
import type { BudgetDto, ListQuery, PointsDto, QuestDto, SettingsDto, StatusDto } from "../common/dto";
export declare class AdminService {
    private readonly db;
    private readonly ledger;
    private readonly quests;
    private readonly queries;
    constructor(db: PrismaService, ledger: LedgerService, quests: QuestsService, queries: QueryService);
    scope(actor: Actor): Prisma.QuestWhereInput;
    checkScope(actor: Actor, entryId: string): void;
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
    questList(actor: Actor, q: ListQuery): Promise<{
        items: {
            rewardAmount: string;
            rewardType: string;
            userStatus: string;
            id: string;
            status: string;
            createdAt: Date;
            version: number;
            description: Prisma.JsonValue;
            entryId: string;
            type: string;
            title: Prisma.JsonValue;
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
    recordList(actor: Actor, q: ListQuery): Promise<{
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
    resources(kind: string, actor: Actor, q: ListQuery): Promise<{
        items: {
            costAtomic: string;
            name: string;
            id: string;
            status: string;
            chainId: string;
            version: number;
            slug: string;
            description: Prisma.JsonValue;
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
            payload: Prisma.JsonValue;
            publishedAt: Date | null;
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
    audit(tx: Tx, actor: Actor, action: string, target: string, reason: string, requestId: string): Promise<void>;
    adjust(tx: Tx, dto: PointsDto): Promise<{
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
    editQuest(tx: Tx, actor: Actor, dto: QuestDto, id?: string): Promise<{
        quest: {
            rewardAmount: string;
            rewardType: string;
            userStatus: string;
            id: string;
            status: string;
            createdAt: Date;
            version: number;
            description: Prisma.JsonValue;
            entryId: string;
            type: string;
            title: Prisma.JsonValue;
            reviewMode: string;
            startTime: Date;
            endTime: Date;
        };
    }>;
    questStatus(tx: Tx, actor: Actor, id: string, dto: StatusDto): Promise<{
        quest: {
            rewardAmount: string;
            rewardType: string;
            userStatus: string;
            id: string;
            status: string;
            createdAt: Date;
            version: number;
            description: Prisma.JsonValue;
            entryId: string;
            type: string;
            title: Prisma.JsonValue;
            reviewMode: string;
            startTime: Date;
            endTime: Date;
        };
    }>;
    addBudget(tx: Tx, id: string, dto: BudgetDto): Promise<{
        questId: string;
        availableAtomic: string;
    }>;
    getBudget(actor: Actor, id: string): Promise<{
        questId: string;
        availableAtomic: string;
        assetId: string;
    }>;
    saveSettings(tx: Tx, actor: Actor, dto: SettingsDto): Promise<{
        version: number;
        maintenance: boolean;
        gameCostAtomic: string;
        maxFighters: number;
    }>;
}
