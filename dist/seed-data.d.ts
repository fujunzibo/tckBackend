export declare const games: {
    id: string;
    slug: string;
    name: string;
    description: import("./public-presentation").PublicCopy;
    kind: string;
    chainId: string;
    assetId: string;
    entryId: string;
    mode: string;
    status: string;
    color: string;
    costAtomic: string;
    version: number;
}[];
export declare function initialQuests(): {
    startTime: string;
    endTime: string;
    rewardType: string;
    status: string;
    version: number;
    id: string;
    title: import("./public-presentation").PublicCopy;
    description: import("./public-presentation").PublicCopy;
    type: string;
    rewardAmount: string;
    reviewMode: string;
}[];
