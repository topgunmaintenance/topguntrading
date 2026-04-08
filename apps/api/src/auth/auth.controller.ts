import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import type { Request } from "express";
import { REFRESH_TOKEN_COOKIE, type AuthResponse, type User } from "@topgun/types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuthService } from "./auth.service";
import {
  LoginRequestSchema,
  SignupRequestSchema,
  type LoginRequest,
  type SignupRequest,
} from "./dto";
import { AuthGuard } from "./auth.guard";
import { CurrentUser } from "./current-user.decorator";
import type { JwtPayload } from "@topgun/types";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(SignupRequestSchema))
  async signup(@Body() body: SignupRequest, @Req() req: Request): Promise<AuthResponse> {
    return this.auth.signup(body, this.ctxFromRequest(req));
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(LoginRequestSchema))
  async login(@Body() body: LoginRequest, @Req() req: Request): Promise<AuthResponse> {
    return this.auth.login(body, this.ctxFromRequest(req));
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request): Promise<AuthResponse> {
    const raw = this.extractRefreshToken(req);
    if (!raw) {
      throw new UnauthorizedException({
        code: "unauthorized",
        message: "Missing refresh token",
      });
    }
    return this.auth.refresh(raw, this.ctxFromRequest(req));
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request): Promise<void> {
    const raw = this.extractRefreshToken(req);
    if (raw) {
      await this.auth.logout(raw);
    }
  }

  @Get("me")
  @UseGuards(AuthGuard)
  async me(@CurrentUser() payload: JwtPayload): Promise<{ user: User }> {
    const user = await this.auth.getUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        code: "unauthorized",
        message: "Session no longer valid",
      });
    }
    return { user };
  }

  private ctxFromRequest(req: Request): {
    userAgent: string | undefined;
    ipAddress: string | undefined;
  } {
    const userAgent = req.headers["user-agent"];
    const ipAddress =
      typeof req.headers["x-forwarded-for"] === "string"
        ? req.headers["x-forwarded-for"].split(",")[0]?.trim()
        : req.ip;
    return {
      userAgent: typeof userAgent === "string" ? userAgent : undefined,
      ipAddress: typeof ipAddress === "string" ? ipAddress : undefined,
    };
  }

  private extractRefreshToken(req: Request): string | undefined {
    // Refresh token is typically carried in an HTTP-only cookie, but
    // we also accept a JSON body for testing and service-to-service
    // calls that don't have a cookie jar.
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    const cookieValue = cookies?.[REFRESH_TOKEN_COOKIE];
    if (cookieValue) return cookieValue;
    const body = req.body as { refreshToken?: unknown } | undefined;
    return typeof body?.refreshToken === "string" ? body.refreshToken : undefined;
  }
}
