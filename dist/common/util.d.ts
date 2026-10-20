import { Prisma } from "@prisma/client";
export declare const hash: (text: string) => string;
export declare const secret: () => string;
export declare function passwordHash(password: string): string;
export declare function passwordMatches(password: string, encoded: string): boolean;
export declare function atomic(value: string, allowNegative?: boolean, max?: bigint): bigint;
export declare const json: (value: unknown) => Prisma.InputJsonValue;
export declare const copy: (zh: string, en?: string, ja?: string, ko?: string) => {
    zh: string;
    en: string;
    ja: string;
    ko: string;
};
export declare const period: (type: string) => string;
export declare const levelFor: (n: bigint) => "Platinum" | "Gold" | "Silver" | "Bronze";
export declare function canonical(value: unknown): string;
