import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import type { ListQuery } from "./dto";
export declare const offset: (q: ListQuery) => {
    take: number;
    skip: number;
};
export declare function paged<T>(q: ListQuery, items: Promise<T[]>, count: Promise<number>): Promise<{
    items: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const newest: readonly [{
    readonly createdAt: "desc";
}, {
    readonly id: "desc";
}];
export declare class Cursors {
    private readonly config;
    constructor(config: ConfigService);
    private sign;
    private scope;
    after(q: ListQuery, identity: string): {
        OR?: {
            createdAt: Date | Prisma.DateTimeFilter;
            id?: {
                lt: string;
            };
        }[];
    };
    result<T extends {
        id: string;
        createdAt: Date;
    }, R>(rows: T[], q: ListQuery, identity: string, view: (row: T) => R): {
        items: R[];
        hasMore: boolean;
        nextCursor: string | null;
    };
}
