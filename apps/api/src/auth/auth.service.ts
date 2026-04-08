import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { User as PrismaUser, Session as PrismaSession } from "@prisma/client";
import type { AuthResponse, User, LoginRequest, SignupRequest } from "@topgun/types";
import { PrismaService } from "../prisma/prisma.service";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";

export interface SessionContext {
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  async signup(input: SignupRequest, ctx: SessionContext): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        code: "conflict",
        message: "An account with that email already exists",
      });
    }

    const passwordHash = await this.passwords.hash(input.password);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        displayName: input.displayName ?? null,
      },
    });

    return this.issueSession(user, ctx);
  }

  async login(input: LoginRequest, ctx: SessionContext): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) {
      // Do not reveal whether the email exists.
      throw new UnauthorizedException({
        code: "unauthorized",
        message: "Invalid email or password",
      });
    }
    const ok = await this.passwords.verify(user.passwordHash, input.password);
    if (!ok) {
      throw new UnauthorizedException({
        code: "unauthorized",
        message: "Invalid email or password",
      });
    }
    return this.issueSession(user, ctx);
  }

  async refresh(rawRefreshToken: string, ctx: SessionContext): Promise<AuthResponse> {
    const hash = this.tokens.hashRefreshToken(rawRefreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException({
        code: "unauthorized",
        message: "Refresh token is invalid or expired",
      });
    }

    // Rotate: revoke the old session and issue a new one in a single
    // transaction so a partial failure can't leave us with two live
    // refresh tokens for the same chain.
    const refresh = this.tokens.issueRefreshToken();
    const newSession = await this.prisma.$transaction(async (tx) => {
      await tx.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      return tx.session.create({
        data: {
          userId: session.userId,
          refreshTokenHash: refresh.tokenHash,
          userAgent: ctx.userAgent ?? null,
          ipAddress: ctx.ipAddress ?? null,
          expiresAt: refresh.expiresAt,
        },
      });
    });

    const access = this.tokens.issueAccessToken(session.userId, newSession.id);
    return {
      user: this.toPublicUser(session.user),
      tokens: {
        accessToken: access.token,
        accessTokenExpiresAt: access.expiresAt.toISOString(),
        refreshToken: refresh.token,
        refreshTokenExpiresAt: refresh.expiresAt.toISOString(),
      },
    };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const hash = this.tokens.hashRefreshToken(rawRefreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? this.toPublicUser(user) : null;
  }

  private async issueSession(user: PrismaUser, ctx: SessionContext): Promise<AuthResponse> {
    const refresh = this.tokens.issueRefreshToken();
    const session: PrismaSession = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: refresh.tokenHash,
        userAgent: ctx.userAgent ?? null,
        ipAddress: ctx.ipAddress ?? null,
        expiresAt: refresh.expiresAt,
      },
    });
    const access = this.tokens.issueAccessToken(user.id, session.id);
    return {
      user: this.toPublicUser(user),
      tokens: {
        accessToken: access.token,
        accessTokenExpiresAt: access.expiresAt.toISOString(),
        refreshToken: refresh.token,
        refreshTokenExpiresAt: refresh.expiresAt.toISOString(),
      },
    };
  }

  private toPublicUser(user: PrismaUser): User {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
