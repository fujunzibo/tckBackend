import type { Tx } from "../prisma/prisma.service";
import { copy } from "../common/util";
export declare class EventsService {
    emit(tx: Tx, eventKey: string, type: string, userId: string, entityId: string, version: number, title: ReturnType<typeof copy>, href: string): Promise<void>;
    job(tx: Tx, businessKey: string, type: string, entityId: string, userId: string, runAt: Date): Promise<void>;
}
