import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "../src/auth/auth.service";
import { PasswordService } from "../src/auth/password.service";
import { TokenService } from "../src/auth/token.service";
import type { Env } from "../src/config/env";

const env: Env = {
  NODE_ENV: "test",
  API_PORT: 4001,
  API_PUBLIC_URL: "http://localhost:4001",
  API_CORS_ORIGINS: ["http://localhost:3000"],
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  AUTH_SECRET: "test-auth-secret-at-least-32-characters-xx",
  SESSION_TTL_SECONDS: 900,
  REFRESH_TTL_SECONDS: 60 * 60 * 24 * 30,
};

type User = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type Session = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
};

function makePrismaMock() {
  const users = new Map<string, User>();
  const sessions = new Map<string, Session>();
  let userSeq = 0;
  let sessionSeq = 0;

  const prisma = {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id) return users.get(where.id) ?? null;
        if (where.email)
          return Array.from(users.values()).find((u) => u.email === where.email) ?? null;
        return null;
      }),
      create: vi.fn(async ({ data }: { data: Partial<User> }) => {
        const id = `usr_${++userSeq}`;
        const now = new Date();
        const user: User = {
          id,
          email: data.email!,
          passwordHash: data.passwordHash!,
          displayName: data.displayName ?? null,
          createdAt: now,
          updatedAt: now,
        };
        users.set(id, user);
        return user;
      }),
    },
    session: {
      create: vi.fn(async ({ data }: { data: Partial<Session> }) => {
        const id = `sess_${++sessionSeq}`;
        const now = new Date();
        const session: Session = {
          id,
          userId: data.userId!,
          refreshTokenHash: data.refreshTokenHash!,
          userAgent: data.userAgent ?? null,
          ipAddress: data.ipAddress ?? null,
          createdAt: now,
          lastUsedAt: now,
          expiresAt: data.expiresAt!,
          revokedAt: null,
        };
        sessions.set(id, session);
        return session;
      }),
      findUnique: vi.fn(
        async ({
          where,
          include,
        }: {
          where: { refreshTokenHash: string };
          include?: { user: boolean };
        }) => {
          const found = Array.from(sessions.values()).find(
            (s) => s.refreshTokenHash === where.refreshTokenHash,
          );
          if (!found) return null;
          if (include?.user) {
            return { ...found, user: users.get(found.userId)! };
          }
          return found;
        },
      ),
      update: vi.fn(
        async ({ where, data }: { where: { id: string }; data: Partial<Session> }) => {
          const found = sessions.get(where.id);
          if (!found) return null;
          const updated = { ...found, ...data };
          sessions.set(where.id, updated);
          return updated;
        },
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { refreshTokenHash: string; revokedAt: null };
          data: { revokedAt: Date };
        }) => {
          let count = 0;
          for (const [id, s] of sessions) {
            if (s.refreshTokenHash === where.refreshTokenHash && s.revokedAt === null) {
              sessions.set(id, { ...s, revokedAt: data.revokedAt });
              count++;
            }
          }
          return { count };
        },
      ),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
  };

  return prisma;
}

describe("AuthService", () => {
  let prisma: ReturnType<typeof makePrismaMock>;
  let passwords: PasswordService;
  let tokens: TokenService;
  let service: AuthService;

  beforeEach(() => {
    prisma = makePrismaMock();
    passwords = new PasswordService();
    tokens = new TokenService(env);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new AuthService(prisma as any, passwords, tokens);
  });

  it("signs a user up and returns a public user + token pair", async () => {
    const res = await service.signup(
      {
        email: "pilot@topguntrading.example",
        password: "correct horse battery staple",
        displayName: "Pilot",
      },
      { userAgent: "vitest", ipAddress: "127.0.0.1" },
    );
    expect(res.user.email).toBe("pilot@topguntrading.example");
    expect(res.tokens.accessToken).toMatch(/\./);
    expect(res.tokens.refreshToken.length).toBeGreaterThan(10);
    // @ts-expect-error — ensure we did not leak the hash on the wire
    expect(res.user.passwordHash).toBeUndefined();
  });

  it("rejects a duplicate email with a 409-shaped error", async () => {
    await service.signup(
      {
        email: "pilot@topguntrading.example",
        password: "correct horse battery staple",
      },
      {},
    );
    await expect(
      service.signup(
        {
          email: "pilot@topguntrading.example",
          password: "correct horse battery staple",
        },
        {},
      ),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("logs a user in with the right password", async () => {
    await service.signup(
      {
        email: "pilot@topguntrading.example",
        password: "correct horse battery staple",
      },
      {},
    );
    const res = await service.login(
      {
        email: "pilot@topguntrading.example",
        password: "correct horse battery staple",
      },
      {},
    );
    expect(res.user.email).toBe("pilot@topguntrading.example");
  });

  it("rejects login with the wrong password", async () => {
    await service.signup(
      {
        email: "pilot@topguntrading.example",
        password: "correct horse battery staple",
      },
      {},
    );
    await expect(
      service.login(
        {
          email: "pilot@topguntrading.example",
          password: "wrong password wrong",
        },
        {},
      ),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("refreshes a session and rotates the refresh token", async () => {
    const first = await service.signup(
      {
        email: "pilot@topguntrading.example",
        password: "correct horse battery staple",
      },
      {},
    );
    const second = await service.refresh(first.tokens.refreshToken, {});
    expect(second.tokens.refreshToken).not.toBe(first.tokens.refreshToken);
    // The original refresh token must no longer work after rotation.
    await expect(service.refresh(first.tokens.refreshToken, {})).rejects.toMatchObject({
      status: 401,
    });
  });

  it("logs a user out by revoking the session behind the refresh token", async () => {
    const first = await service.signup(
      {
        email: "pilot@topguntrading.example",
        password: "correct horse battery staple",
      },
      {},
    );
    await service.logout(first.tokens.refreshToken);
    await expect(service.refresh(first.tokens.refreshToken, {})).rejects.toMatchObject({
      status: 401,
    });
  });
});
