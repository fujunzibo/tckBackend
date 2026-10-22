export declare class LoginDto {
    nickname: string;
    resumeSecret?: string;
    ref?: string;
}
export declare class WalletNonceDto {
    walletAddress: string;
    chainId: number;
}
export declare class WalletLoginDto {
    walletAddress: string;
    nonce: string;
    signature: string;
    ref?: string;
}
export declare class AdminLoginDto {
    username: string;
    password: string;
}
export declare class ProfileDto {
    nickname: string;
}
export declare class QuoteDto {
    choice: string;
}
export declare class SessionDto {
    quoteId: string;
}
export declare class FighterDto {
    name: string;
    style: string;
    simulateFailure?: boolean;
}
export declare class FightDto {
    fighterId: string;
}
export declare class ProofDto {
    proof?: string;
}
export declare class ReviewDto {
    version: number;
    action: string;
    reason?: string;
}
export declare class PointsDto {
    userId: string;
    changeAmount: string;
    reason: string;
}
export declare class QuestDto {
    title: string;
    description: string;
    type: string;
    reviewMode: string;
    rewardAmount: string;
    status: string;
    startTime: string;
    endTime: string;
    version?: number;
    entryId?: string;
}
export declare class StatusDto {
    version: number;
    status: string;
}
export declare class UserStatusDto {
    status: string;
    reason: string;
}
export declare class SettingsDto {
    version: number;
    maintenance: boolean;
    gameCostAtomic: string;
    maxFighters: number;
}
export declare class ReadAllDto {
    ids: string[];
}
export declare class BindDto {
    ref: string;
}
export declare class BudgetDto {
    amountAtomic: string;
    reason: string;
}
export declare class EmptyDto {
}
export declare class ListQuery {
    page: number;
    pageSize: number;
    cursor?: string;
    status?: string;
    type?: string;
    slug?: string;
    gameKind?: string;
    kind?: string;
    chainId?: string;
    assetId?: string;
    mode?: string;
    entryId?: string;
    unread?: string;
    keyword?: string;
    level?: string;
    userId?: string;
    source?: string;
    reviewStatus?: string;
}
