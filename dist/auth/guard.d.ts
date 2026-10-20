import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
export declare const Access: (domain: "public" | "optional" | "user" | "admin", permission?: string) => import("@nestjs/common").CustomDecorator<string>;
export declare const rolePermissions: Record<string, readonly string[]>;
export declare class AuthGuard implements CanActivate {
    private readonly reflector;
    private readonly jwt;
    private readonly config;
    private readonly db;
    constructor(reflector: Reflector, jwt: JwtService, config: ConfigService, db: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
