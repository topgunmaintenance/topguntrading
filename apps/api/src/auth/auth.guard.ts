import {
  CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { ACCESS_TOKEN_COOKIE, type JwtPayload } from "@topgun/types";
import { TokenService } from "./token.service";

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Validates an access token from either the `Authorization: Bearer`
 * header or the `tg_access` HTTP-only cookie. On success, attaches the
 * decoded JWT payload to `request.user`.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException({
        code: "unauthorized",
        message: "Missing access token",
      });
    }
    request.user = this.tokens.verifyAccessToken(token);
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      return header.slice("Bearer ".length);
    }
    const cookies = (request as Request & { cookies?: Record<string, string> }).cookies;
    return cookies?.[ACCESS_TOKEN_COOKIE];
  }
}
