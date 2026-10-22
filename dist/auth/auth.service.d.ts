import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService, type Tx } from "../prisma/prisma.service";
import { LedgerService } from "../assets/ledger.service";
import type { Actor } from "./types";
import type { AdminLoginDto, LoginDto, WalletLoginDto, WalletNonceDto } from "../common/dto";
export declare class AuthService {
    private readonly db;
    private readonly config;
    private readonly jwt;
    private readonly ledger;
    private readonly dummyHash;
    constructor(db: PrismaService, config: ConfigService, jwt: JwtService, ledger: LedgerService);
    throttle(ip: string, kind: string, limit: number): Promise<void>;
    login(dto: LoginDto, ip: string): Promise<{
        user: {
            id: string;
            nickname: string;
            walletAddress: string;
            invitationCode: string;
            inviterId: string | undefined;
            pointsExact: string;
            level: string;
            status: string;
            createdAt: string;
            platformMode: string;
            dataSource: string;
            actorType: string;
        };
        resumeSecret: string;
        accessToken: string;
        tokenType: string;
        expiresIn: number;
    }>;
    walletNonce(dto: WalletNonceDto, ip: string, originHeader?: string, refererHeader?: string): Promise<{
        nonce: string;
        message: string;
        expiresAt: string;
    }>;
    walletLogin(dto: WalletLoginDto, ip: string): Promise<{
        user: {
            id: string;
            nickname: string;
            walletAddress: string;
            invitationCode: string;
            inviterId: string | undefined;
            pointsExact: string;
            level: string;
            status: string;
            createdAt: string;
            platformMode: string;
            dataSource: string;
            actorType: string;
        };
        accessToken: string;
        tokenType: string;
        expiresIn: number;
    }>;
    private signInSite;
    private callerOrigin;
    private walletAddress;
    adminLogin(dto: AdminLoginDto, ip: string, requestId: string): Promise<{
        admin: {
            id: string;
            username: string;
            role: string;
            entryIds: string[];
        };
        accessToken: string;
        tokenType: string;
        expiresIn: number;
    }>;
    private issue;
    me(actor: Actor): Promise<{
        user: {
            id: string;
            nickname: string;
            walletAddress: string;
            invitationCode: string;
            inviterId: string | undefined;
            pointsExact: string;
            level: string;
            status: string;
            createdAt: string;
            platformMode: string;
            dataSource: string;
            actorType: string;
        };
        admin?: undefined;
    } | {
        admin: {
            id: string;
            username: string;
            role: string;
            entryIds: string[];
        };
        user?: undefined;
    }>;
    logout(actor: Actor): Promise<{
        loggedOut: boolean;
    }>;
    bind(tx: Tx, userId: string, ref: string, strict?: boolean): Promise<void>;
}
