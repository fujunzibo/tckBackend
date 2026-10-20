import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, PrismaClient } from "@prisma/client";
import type { Actor } from "../auth/types";
export type Tx = Prisma.TransactionClient;
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    serial<T>(work: (tx: Tx) => Promise<T>): Promise<T>;
    lock(tx: Tx, key: string): Promise<void>;
    assertActor(tx: Tx, actor: Actor): Promise<void>;
    command<T>(actor: Actor, operation: string, key: string | undefined, body: unknown, work: (tx: Tx) => Promise<T>): Promise<T>;
}
