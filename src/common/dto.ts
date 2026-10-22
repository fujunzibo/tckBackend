import { Transform, Type, type TransformFnParams } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
const Trim = () =>
  Transform(({ value }: TransformFnParams) =>
    typeof value === "string" ? value.trim() : value,
  );
export class LoginDto {
  @Trim() @IsString() @MinLength(2) @MaxLength(32) nickname!: string;
  @IsOptional() @IsString() @Matches(/^[a-f0-9]{64}$/) resumeSecret?: string;
  @IsOptional() @IsString() @MaxLength(32) ref?: string;
}
export class WalletNonceDto {
  @IsString() @Matches(/^0x[\da-fA-F]{40}$/) walletAddress!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(2147483647) chainId!: number;
}
export class WalletLoginDto {
  @IsString() @Matches(/^0x[\da-fA-F]{40}$/) walletAddress!: string;
  @IsString() @Matches(/^[a-f0-9]{64}$/) nonce!: string;
  @IsString() @Matches(/^0x[\da-fA-F]{130}$/) signature!: string;
  @IsOptional() @IsString() @MaxLength(32) ref?: string;
}
export class AdminLoginDto {
  @IsString() @MaxLength(64) username!: string;
  @IsString() @MinLength(1) @MaxLength(200) password!: string;
}
export class ProfileDto {
  @Trim() @IsString() @MinLength(2) @MaxLength(32) nickname!: string;
}
export class QuoteDto {
  @IsIn(["heads", "tails"]) choice!: string;
}
export class SessionDto {
  @IsString() @MaxLength(100) quoteId!: string;
}
export class FighterDto {
  @Trim() @IsString() @MinLength(2) @MaxLength(24) name!: string;
  @IsIn(["striker", "guardian", "tactician"]) style!: string;
  @IsOptional() @IsBoolean() simulateFailure?: boolean;
}
export class FightDto {
  @IsString() @MaxLength(100) fighterId!: string;
}
export class ProofDto {
  @IsOptional() @IsString() @MaxLength(2000) proof?: string;
}
export class ReviewDto {
  @IsInt() @Min(1) version!: number;
  @IsIn(["approve", "reject"]) action!: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
export class PointsDto {
  @IsString() @MaxLength(100) userId!: string;
  @IsString() @Matches(/^-?[1-9]\d{0,6}$/) changeAmount!: string;
  @Trim() @IsString() @MinLength(3) @MaxLength(300) reason!: string;
}
export class QuestDto {
  @Trim() @IsString() @MinLength(2) @MaxLength(100) title!: string;
  @Trim() @IsString() @MinLength(10) @MaxLength(2000) description!: string;
  @IsIn(["daily", "game", "social"]) type!: string;
  @IsIn(["auto", "manual"]) reviewMode!: string;
  @IsString() @Matches(/^[1-9]\d{0,6}$/) rewardAmount!: string;
  @IsIn(["draft", "published", "offline"]) status!: string;
  @IsISO8601({ strict: true }) startTime!: string;
  @IsISO8601({ strict: true }) endTime!: string;
  @IsOptional() @IsInt() @Min(1) version?: number;
  @IsOptional() @IsString() @MaxLength(100) entryId?: string;
}
export class StatusDto {
  @IsInt() @Min(1) version!: number;
  @IsIn(["draft", "published", "offline"]) status!: string;
}
export class UserStatusDto {
  @IsIn(["normal", "frozen"]) status!: string;
  @Trim() @IsString() @MinLength(3) @MaxLength(300) reason!: string;
}
export class SettingsDto {
  @IsInt() @Min(1) version!: number;
  @IsBoolean() maintenance!: boolean;
  @IsString() @Matches(/^[1-9]\d{0,3}$/) gameCostAtomic!: string;
  @IsInt() @Min(1) @Max(10) maxFighters!: number;
}
export class ReadAllDto {
  @IsArray()
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  ids!: string[];
}
export class BindDto {
  @IsString() @MinLength(1) @MaxLength(32) ref!: string;
}
export class BudgetDto {
  @IsString() @Matches(/^[1-9]\d{0,12}$/) amountAtomic!: string;
  @Trim() @IsString() @MinLength(3) @MaxLength(300) reason!: string;
}
export class EmptyDto {}
export class ListQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 12;
  @IsOptional() @IsString() @MaxLength(2048) cursor?: string;
  @IsOptional() @IsString() @MaxLength(100) status?: string;
  @IsOptional() @IsString() @MaxLength(100) type?: string;
  @IsOptional() @IsString() @MaxLength(100) slug?: string;
  @IsOptional() @IsString() @MaxLength(100) gameKind?: string;
  @IsOptional() @IsString() @MaxLength(100) kind?: string;
  @IsOptional() @IsString() @MaxLength(100) chainId?: string;
  @IsOptional() @IsString() @MaxLength(100) assetId?: string;
  @IsOptional() @IsString() @MaxLength(100) mode?: string;
  @IsOptional() @IsString() @MaxLength(100) entryId?: string;
  @IsOptional() @IsIn(["true", "false"]) unread?: string;
  @IsOptional() @IsString() @MaxLength(100) keyword?: string;
  @IsOptional() @IsString() @MaxLength(100) level?: string;
  @IsOptional() @IsString() @MaxLength(100) userId?: string;
  @IsOptional() @IsString() @MaxLength(100) source?: string;
  @IsOptional() @IsString() @MaxLength(100) reviewStatus?: string;
}
