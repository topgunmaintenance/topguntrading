import { describe, expect, it } from "vitest";
import { TokenService } from "../src/auth/token.service";
import type { Env } from "../src/config/env";

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    NODE_ENV: "test",
    API_PORT: 4001,
    API_PUBLIC_URL: "http://localhost:4001",
    API_CORS_ORIGINS: ["http://localhost:3000"],
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    AUTH_SECRET: "test-auth-secret-at-least-32-characters-xx",
    SESSION_TTL_SECONDS: 900,
    REFRESH_TTL_SECONDS: 60 * 60 * 24 * 30,
    ...overrides,
  };
}

describe("TokenService", () => {
  it("issues a JWT access token that verifies back", () => {
    const svc = new TokenService(makeEnv());
    const { token } = svc.issueAccessToken("usr_1", "sess_1");
    const payload = svc.verifyAccessToken(token);
    expect(payload.sub).toBe("usr_1");
    expect(payload.sid).toBe("sess_1");
  });

  it("throws on a tampered access token", () => {
    const svc = new TokenService(makeEnv());
    expect(() => svc.verifyAccessToken("not.a.jwt")).toThrow();
  });

  it("produces a refresh token whose sha256 hash is deterministic", () => {
    const svc = new TokenService(makeEnv());
    const issued = svc.issueRefreshToken();
    expect(issued.token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(issued.tokenHash).toHaveLength(64);
    expect(svc.hashRefreshToken(issued.token)).toBe(issued.tokenHash);
  });

  it("respects custom TTLs", () => {
    const svc = new TokenService(makeEnv({ SESSION_TTL_SECONDS: 1 }));
    const { expiresAt } = svc.issueAccessToken("usr_1", "sess_1");
    expect(expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(1100);
  });
});
