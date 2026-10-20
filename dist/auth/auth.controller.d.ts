import { AdminLoginDto, EmptyDto, LoginDto } from "../common/dto";
import { AuthService } from "./auth.service";
import type { ApiRequest } from "./types";
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    login(dto: LoginDto, r: ApiRequest): Promise<{
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
    adminLogin(dto: AdminLoginDto, r: ApiRequest): Promise<{
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
    me(r: ApiRequest): Promise<{
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
    adminMe(r: ApiRequest): Promise<{
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
    logout(_dto: EmptyDto, r: ApiRequest): Promise<{
        loggedOut: boolean;
    }>;
    adminLogout(_dto: EmptyDto, r: ApiRequest): Promise<{
        loggedOut: boolean;
    }>;
    walletDisabled(): void;
}
