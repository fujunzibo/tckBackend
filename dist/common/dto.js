"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListQuery = exports.EmptyDto = exports.BudgetDto = exports.BindDto = exports.ReadAllDto = exports.SettingsDto = exports.UserStatusDto = exports.StatusDto = exports.QuestDto = exports.PointsDto = exports.ReviewDto = exports.ProofDto = exports.FightDto = exports.FighterDto = exports.SessionDto = exports.QuoteDto = exports.ProfileDto = exports.AdminLoginDto = exports.WalletLoginDto = exports.WalletNonceDto = exports.LoginDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const Trim = () => (0, class_transformer_1.Transform)(({ value }) => typeof value === "string" ? value.trim() : value);
class LoginDto {
    nickname;
    resumeSecret;
    ref;
    static _OPENAPI_METADATA_FACTORY() {
        return { nickname: { required: true, type: () => String, minLength: 2, maxLength: 32 }, resumeSecret: { required: false, type: () => String, pattern: "^[a-f0-9]{64}$" }, ref: { required: false, type: () => String, maxLength: 32 } };
    }
}
exports.LoginDto = LoginDto;
__decorate([
    Trim(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], LoginDto.prototype, "nickname", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-f0-9]{64}$/),
    __metadata("design:type", String)
], LoginDto.prototype, "resumeSecret", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], LoginDto.prototype, "ref", void 0);
class WalletNonceDto {
    walletAddress;
    chainId;
    static _OPENAPI_METADATA_FACTORY() {
        return { walletAddress: { required: true, type: () => String, pattern: "^0x[\\da-fA-F]{40}$" }, chainId: { required: true, type: () => Number, minimum: 1, maximum: 2147483647 } };
    }
}
exports.WalletNonceDto = WalletNonceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^0x[\da-fA-F]{40}$/),
    __metadata("design:type", String)
], WalletNonceDto.prototype, "walletAddress", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(2147483647),
    __metadata("design:type", Number)
], WalletNonceDto.prototype, "chainId", void 0);
class WalletLoginDto {
    walletAddress;
    nonce;
    signature;
    ref;
    static _OPENAPI_METADATA_FACTORY() {
        return { walletAddress: { required: true, type: () => String, pattern: "^0x[\\da-fA-F]{40}$" }, nonce: { required: true, type: () => String, pattern: "^[a-f0-9]{64}$" }, signature: { required: true, type: () => String, pattern: "^0x[\\da-fA-F]{130}$" }, ref: { required: false, type: () => String, maxLength: 32 } };
    }
}
exports.WalletLoginDto = WalletLoginDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^0x[\da-fA-F]{40}$/),
    __metadata("design:type", String)
], WalletLoginDto.prototype, "walletAddress", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-f0-9]{64}$/),
    __metadata("design:type", String)
], WalletLoginDto.prototype, "nonce", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^0x[\da-fA-F]{130}$/),
    __metadata("design:type", String)
], WalletLoginDto.prototype, "signature", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], WalletLoginDto.prototype, "ref", void 0);
class AdminLoginDto {
    username;
    password;
    static _OPENAPI_METADATA_FACTORY() {
        return { username: { required: true, type: () => String, maxLength: 64 }, password: { required: true, type: () => String, minLength: 1, maxLength: 200 } };
    }
}
exports.AdminLoginDto = AdminLoginDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], AdminLoginDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], AdminLoginDto.prototype, "password", void 0);
class ProfileDto {
    nickname;
    static _OPENAPI_METADATA_FACTORY() {
        return { nickname: { required: true, type: () => String, minLength: 2, maxLength: 32 } };
    }
}
exports.ProfileDto = ProfileDto;
__decorate([
    Trim(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], ProfileDto.prototype, "nickname", void 0);
class QuoteDto {
    choice;
    static _OPENAPI_METADATA_FACTORY() {
        return { choice: { required: true, type: () => String, enum: ["heads", "tails"] } };
    }
}
exports.QuoteDto = QuoteDto;
__decorate([
    (0, class_validator_1.IsIn)(["heads", "tails"]),
    __metadata("design:type", String)
], QuoteDto.prototype, "choice", void 0);
class SessionDto {
    quoteId;
    static _OPENAPI_METADATA_FACTORY() {
        return { quoteId: { required: true, type: () => String, maxLength: 100 } };
    }
}
exports.SessionDto = SessionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], SessionDto.prototype, "quoteId", void 0);
class FighterDto {
    name;
    style;
    simulateFailure;
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 2, maxLength: 24 }, style: { required: true, type: () => String, enum: ["striker", "guardian", "tactician"] }, simulateFailure: { required: false, type: () => Boolean } };
    }
}
exports.FighterDto = FighterDto;
__decorate([
    Trim(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(24),
    __metadata("design:type", String)
], FighterDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["striker", "guardian", "tactician"]),
    __metadata("design:type", String)
], FighterDto.prototype, "style", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FighterDto.prototype, "simulateFailure", void 0);
class FightDto {
    fighterId;
    static _OPENAPI_METADATA_FACTORY() {
        return { fighterId: { required: true, type: () => String, maxLength: 100 } };
    }
}
exports.FightDto = FightDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], FightDto.prototype, "fighterId", void 0);
class ProofDto {
    proof;
    static _OPENAPI_METADATA_FACTORY() {
        return { proof: { required: false, type: () => String, maxLength: 2000 } };
    }
}
exports.ProofDto = ProofDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], ProofDto.prototype, "proof", void 0);
class ReviewDto {
    version;
    action;
    reason;
    static _OPENAPI_METADATA_FACTORY() {
        return { version: { required: true, type: () => Number, minimum: 1 }, action: { required: true, type: () => String, enum: ["approve", "reject"] }, reason: { required: false, type: () => String, maxLength: 500 } };
    }
}
exports.ReviewDto = ReviewDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ReviewDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["approve", "reject"]),
    __metadata("design:type", String)
], ReviewDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ReviewDto.prototype, "reason", void 0);
class PointsDto {
    userId;
    changeAmount;
    reason;
    static _OPENAPI_METADATA_FACTORY() {
        return { userId: { required: true, type: () => String, maxLength: 100 }, changeAmount: { required: true, type: () => String, pattern: "^-?[1-9]\\d{0,6}$" }, reason: { required: true, type: () => String, minLength: 3, maxLength: 300 } };
    }
}
exports.PointsDto = PointsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], PointsDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^-?[1-9]\d{0,6}$/),
    __metadata("design:type", String)
], PointsDto.prototype, "changeAmount", void 0);
__decorate([
    Trim(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], PointsDto.prototype, "reason", void 0);
class QuestDto {
    title;
    description;
    type;
    reviewMode;
    rewardAmount;
    status;
    startTime;
    endTime;
    version;
    entryId;
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String, minLength: 2, maxLength: 100 }, description: { required: true, type: () => String, minLength: 10, maxLength: 2000 }, type: { required: true, type: () => String, enum: ["daily", "game", "social"] }, reviewMode: { required: true, type: () => String, enum: ["auto", "manual"] }, rewardAmount: { required: true, type: () => String, pattern: "^[1-9]\\d{0,6}$" }, status: { required: true, type: () => String, enum: ["draft", "published", "offline"] }, startTime: { required: true, type: () => String }, endTime: { required: true, type: () => String }, version: { required: false, type: () => Number, minimum: 1 }, entryId: { required: false, type: () => String, maxLength: 100 } };
    }
}
exports.QuestDto = QuestDto;
__decorate([
    Trim(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], QuestDto.prototype, "title", void 0);
__decorate([
    Trim(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], QuestDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["daily", "game", "social"]),
    __metadata("design:type", String)
], QuestDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["auto", "manual"]),
    __metadata("design:type", String)
], QuestDto.prototype, "reviewMode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[1-9]\d{0,6}$/),
    __metadata("design:type", String)
], QuestDto.prototype, "rewardAmount", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["draft", "published", "offline"]),
    __metadata("design:type", String)
], QuestDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)({ strict: true }),
    __metadata("design:type", String)
], QuestDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)({ strict: true }),
    __metadata("design:type", String)
], QuestDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QuestDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], QuestDto.prototype, "entryId", void 0);
class StatusDto {
    version;
    status;
    static _OPENAPI_METADATA_FACTORY() {
        return { version: { required: true, type: () => Number, minimum: 1 }, status: { required: true, type: () => String, enum: ["draft", "published", "offline"] } };
    }
}
exports.StatusDto = StatusDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], StatusDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["draft", "published", "offline"]),
    __metadata("design:type", String)
], StatusDto.prototype, "status", void 0);
class UserStatusDto {
    status;
    reason;
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => String, enum: ["normal", "frozen"] }, reason: { required: true, type: () => String, minLength: 3, maxLength: 300 } };
    }
}
exports.UserStatusDto = UserStatusDto;
__decorate([
    (0, class_validator_1.IsIn)(["normal", "frozen"]),
    __metadata("design:type", String)
], UserStatusDto.prototype, "status", void 0);
__decorate([
    Trim(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], UserStatusDto.prototype, "reason", void 0);
class SettingsDto {
    version;
    maintenance;
    gameCostAtomic;
    maxFighters;
    static _OPENAPI_METADATA_FACTORY() {
        return { version: { required: true, type: () => Number, minimum: 1 }, maintenance: { required: true, type: () => Boolean }, gameCostAtomic: { required: true, type: () => String, pattern: "^[1-9]\\d{0,3}$" }, maxFighters: { required: true, type: () => Number, minimum: 1, maximum: 10 } };
    }
}
exports.SettingsDto = SettingsDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SettingsDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SettingsDto.prototype, "maintenance", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[1-9]\d{0,3}$/),
    __metadata("design:type", String)
], SettingsDto.prototype, "gameCostAtomic", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], SettingsDto.prototype, "maxFighters", void 0);
class ReadAllDto {
    ids;
    static _OPENAPI_METADATA_FACTORY() {
        return { ids: { required: true, type: () => [String], maxLength: 100, maxItems: 1000 } };
    }
}
exports.ReadAllDto = ReadAllDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(1000),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(100, { each: true }),
    __metadata("design:type", Array)
], ReadAllDto.prototype, "ids", void 0);
class BindDto {
    ref;
    static _OPENAPI_METADATA_FACTORY() {
        return { ref: { required: true, type: () => String, minLength: 1, maxLength: 32 } };
    }
}
exports.BindDto = BindDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], BindDto.prototype, "ref", void 0);
class BudgetDto {
    amountAtomic;
    reason;
    static _OPENAPI_METADATA_FACTORY() {
        return { amountAtomic: { required: true, type: () => String, pattern: "^[1-9]\\d{0,12}$" }, reason: { required: true, type: () => String, minLength: 3, maxLength: 300 } };
    }
}
exports.BudgetDto = BudgetDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[1-9]\d{0,12}$/),
    __metadata("design:type", String)
], BudgetDto.prototype, "amountAtomic", void 0);
__decorate([
    Trim(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], BudgetDto.prototype, "reason", void 0);
class EmptyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.EmptyDto = EmptyDto;
class ListQuery {
    page = 1;
    pageSize = 12;
    cursor;
    status;
    type;
    slug;
    gameKind;
    kind;
    chainId;
    assetId;
    mode;
    entryId;
    unread;
    keyword;
    level;
    userId;
    source;
    reviewStatus;
    static _OPENAPI_METADATA_FACTORY() {
        return { page: { required: true, type: () => Object, default: 1, minimum: 1, maximum: 100000 }, pageSize: { required: true, type: () => Object, default: 12, minimum: 1, maximum: 100 }, cursor: { required: false, type: () => String, maxLength: 2048 }, status: { required: false, type: () => String, maxLength: 100 }, type: { required: false, type: () => String, maxLength: 100 }, slug: { required: false, type: () => String, maxLength: 100 }, gameKind: { required: false, type: () => String, maxLength: 100 }, kind: { required: false, type: () => String, maxLength: 100 }, chainId: { required: false, type: () => String, maxLength: 100 }, assetId: { required: false, type: () => String, maxLength: 100 }, mode: { required: false, type: () => String, maxLength: 100 }, entryId: { required: false, type: () => String, maxLength: 100 }, unread: { required: false, type: () => String, enum: ["true", "false"] }, keyword: { required: false, type: () => String, maxLength: 100 }, level: { required: false, type: () => String, maxLength: 100 }, userId: { required: false, type: () => String, maxLength: 100 }, source: { required: false, type: () => String, maxLength: 100 }, reviewStatus: { required: false, type: () => String, maxLength: 100 } };
    }
}
exports.ListQuery = ListQuery;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100000),
    __metadata("design:type", Object)
], ListQuery.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Object)
], ListQuery.prototype, "pageSize", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2048),
    __metadata("design:type", String)
], ListQuery.prototype, "cursor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ListQuery.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ListQuery.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ListQuery.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ListQuery.prototype, "gameKind", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ListQuery.prototype, "kind", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ListQuery.prototype, "chainId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ListQuery.prototype, "assetId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ListQuery.prototype, "mode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ListQuery.prototype, "entryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["true", "false"]),
    __metadata("design:type", String)
], ListQuery.prototype, "unread", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ListQuery.prototype, "keyword", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ListQuery.prototype, "level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ListQuery.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ListQuery.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ListQuery.prototype, "reviewStatus", void 0);
//# sourceMappingURL=dto.js.map