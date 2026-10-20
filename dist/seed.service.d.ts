import { PrismaService } from "./prisma/prisma.service";
import { LedgerService } from "./assets/ledger.service";
export declare function seed(db: PrismaService, ledger: LedgerService, username?: string, password?: string): Promise<void>;
