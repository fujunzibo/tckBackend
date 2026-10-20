import type { Tx } from "../prisma/prisma.service";
export declare const wallet: (userId: string, asset: string) => string;
export declare const treasury: (asset: string) => string;
export declare const hold: (id: string, asset: string) => string;
export declare const budget: (questId: string) => string;
export declare class LedgerService {
    account(tx: Tx, id: string, assetId: string, kind?: string, userId?: string): Promise<{
        id: string;
        userId: string | null;
        assetId: string;
        kind: string;
        balance: import("@prisma/client-runtime-utils").Decimal;
    }>;
    transfer(tx: Tx, businessKey: string, assetId: string, from: string, to: string, amount: bigint, reason: string, referenceId: string): Promise<{
        id: string;
        createdAt: Date;
        businessKey: string;
        reason: string;
        referenceId: string;
    }>;
    assets(tx: Tx, userId: string): Promise<{
        assetId: string;
        symbol: string;
        chainId: string;
        decimals: number;
        availableAtomic: string;
        lockedAtomic: string;
    }[]>;
    signup(tx: Tx, userId: string): Promise<void>;
    lockTicket(tx: Tx, userId: string, businessKey: string): Promise<void>;
    settleTicket(tx: Tx, userId: string, businessKey: string, refund: boolean): Promise<void>;
}
