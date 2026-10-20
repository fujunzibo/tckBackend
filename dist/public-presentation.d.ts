export type PublicCopy = Record<"zh" | "en" | "ja" | "ko", string>;
export declare const copy: (zh: string, en: string, ja: string, ko: string) => PublicCopy;
export declare const FIGHT_WIN_AMOUNT: bigint;
export declare const fightReward: (fight: {
    status: string;
    won: boolean;
}) => {
    assetId: string;
    payoutAtomic: string;
};
export declare const publicText: Record<string, PublicCopy>;
export declare const modeLabels: Record<string, PublicCopy>;
interface CatalogItem {
    id: string;
    slug: string;
    name: string;
    kind: string;
    chainId: string;
    assetId: string;
    entryId: string;
    mode: string;
}
export declare function publicPresentation(games: CatalogItem[], platformMode?: string): {
    platformMode: string;
    text: {
        environment: PublicCopy;
    };
    modes: {
        id: string;
        label: PublicCopy;
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
};
export {};
