import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomBytes, createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { JwtPayloadSchema, type JwtPayload } from "@topgun/types";
import { ENV } from "../config/config.module";
import type { Env } from "../config/env";

export interface IssuedAccessToken {
  token: string;
  expiresAt: Date;
}

export interface IssuedRefreshToken {
  /** Raw token returned to the client exactly once. */
  token: string;
  /** Argon2-ready hash for database storage. */
  tokenHash: string;
  expiresAt: Date;
}

/**
 * JWT access tokens + opaque refresh tokens.
 *
 * Access tokens are short-lived JWTs signed with AUTH_SECRET.
 * Refresh tokens are 48-byte random strings. We store a SHA-256 hash
 * in the `sessions` table (not an Argon2 hash) because refresh tokens
 * are high-entropy random; SHA-256 is sufficient and avoids the cost
 * of Argon2 on every refresh. The raw token is never persisted.
 */
@Injectable()
export class TokenService {
  constructor(@Inject(ENV) private readonly env: Env) {}

  issueAccessToken(userId: string, sessionId: string): IssuedAccessToken {
    const ttl = this.env.SESSION_TTL_SECONDS;
    const token = jwt.sign({ sub: userId, sid: sessionId }, this.env.AUTH_SECRET, {
      expiresIn: ttl,
      algorithm: "HS256",
    });
    const expiresAt = new Date(Date.now() + ttl * 1000);
    return { token, expiresAt };
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.env.AUTH_SECRET, {
        algorithms: ["HS256"],
      });
      return JwtPayloadSchema.parse(decoded);
    } catch {
      throw new UnauthorizedException({
        code: "unauthorized",
        message: "Invalid or expired access token",
      });
    }
  }

  issueRefreshToken(): IssuedRefreshToken {
    const raw = randomBytes(48).toString("base64url");
    const tokenHash = this.hashRefreshToken(raw);
    const expiresAt = new Date(Date.now() + this.env.REFRESH_TTL_SECONDS * 1000);
    return { token: raw, tokenHash, expiresAt };
  }

  hashRefreshToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }
}
