import { Prisma } from "@prisma/client";
import type { Tx } from "../prisma/prisma.service";
import { LedgerService } from "../assets/ledger.service";
import { EventsService } from "../jobs/events.service";
import type { Actor } from "../auth/types";
import type { ReviewDto } from "../common/dto";
export declare class QuestsService {
    private readonly ledger;
    private readonly events;
    constructor(ledger: LedgerService, events: EventsService);
    record(tx: Tx, id: string): Promise<{
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
    }>;
    submit(tx: Tx, userId: string, questId: string, proof?: string): Promise<{
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
    review(tx: Tx, actor: Actor, id: string, dto: ReviewDto): Promise<{
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
    grant(tx: Tx, recordId: string): Promise<void>;
    claim(tx: Tx, userId: string, rewardId?: string, questId?: string): Promise<{
        reward: {
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
        };
    }>;
}
