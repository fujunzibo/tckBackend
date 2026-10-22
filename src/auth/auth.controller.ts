import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  AdminLoginDto,
  EmptyDto,
  LoginDto,
  WalletLoginDto,
  WalletNonceDto,
} from "../common/dto";
import { Access } from "./guard";
import { AuthService } from "./auth.service";
import type { ApiRequest } from "./types";
@ApiTags("Authentication")
@ApiBearerAuth()
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Access("public") @Post("auth/demo-login") login(
    @Body() dto: LoginDto,
    @Req() r: ApiRequest,
  ) {
    return this.auth.login(dto, r.ip ?? "unknown");
  }
  @Access("public") @Post("admin/auth/login") adminLogin(
    @Body() dto: AdminLoginDto,
    @Req() r: ApiRequest,
  ) {
    return this.auth.adminLogin(dto, r.ip ?? "unknown", r.requestId);
  }
  @Access("user") @Get("auth/me") me(@Req() r: ApiRequest) {
    return this.auth.me(r.actor!);
  }
  @Access("admin") @Get("admin/auth/me") adminMe(@Req() r: ApiRequest) {
    return this.auth.me(r.actor!);
  }
  @Access("user") @Post("auth/logout") logout(
    @Body() _dto: EmptyDto,
    @Req() r: ApiRequest,
  ) {
    return this.auth.logout(r.actor!);
  }
  @Access("admin") @Post("admin/auth/logout") adminLogout(
    @Body() _dto: EmptyDto,
    @Req() r: ApiRequest,
  ) {
    return this.auth.logout(r.actor!);
  }
  @Access("public") @Post("auth/nonce") nonce(
    @Body() dto: WalletNonceDto,
    @Req() r: ApiRequest,
  ) {
    return this.auth.walletNonce(
      dto,
      r.ip ?? "unknown",
      r.header("origin"),
      r.header("referer"),
    );
  }
  @Access("public") @Post("auth/login") walletLogin(
    @Body() dto: WalletLoginDto,
    @Req() r: ApiRequest,
  ) {
    return this.auth.walletLogin(dto, r.ip ?? "unknown");
  }
}
