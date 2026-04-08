import { describe, expect, it } from "vitest";
import { UserSchema } from "./user";
import {
  LoginRequestSchema,
  SignupRequestSchema,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "./auth";

describe("UserSchema", () => {
  it("accepts a well-formed user", () => {
    const result = UserSchema.safeParse({
      id: "usr_01HV0000000000000000000000",
      email: "pilot@topguntrading.example",
      displayName: "Pilot",
      createdAt: "2026-04-08T12:00:00.000+00:00",
      updatedAt: "2026-04-08T12:00:00.000+00:00",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed email", () => {
    const result = UserSchema.safeParse({
      id: "usr_1",
      email: "not-an-email",
      displayName: null,
      createdAt: "2026-04-08T12:00:00.000+00:00",
      updatedAt: "2026-04-08T12:00:00.000+00:00",
    });
    expect(result.success).toBe(false);
  });

  it("allows a null displayName", () => {
    const result = UserSchema.safeParse({
      id: "usr_1",
      email: "pilot@topguntrading.example",
      displayName: null,
      createdAt: "2026-04-08T12:00:00.000+00:00",
      updatedAt: "2026-04-08T12:00:00.000+00:00",
    });
    expect(result.success).toBe(true);
  });
});

describe("SignupRequestSchema", () => {
  it("requires a password of at least 12 characters", () => {
    const bad = SignupRequestSchema.safeParse({
      email: "pilot@topguntrading.example",
      password: "short",
    });
    expect(bad.success).toBe(false);

    const good = SignupRequestSchema.safeParse({
      email: "pilot@topguntrading.example",
      password: "correct horse battery staple",
    });
    expect(good.success).toBe(true);
  });

  it("lowercases and trims the email", () => {
    const result = SignupRequestSchema.parse({
      email: "  PILOT@TopGunTrading.Example  ",
      password: "correct horse battery staple",
    });
    expect(result.email).toBe("pilot@topguntrading.example");
  });
});

describe("LoginRequestSchema", () => {
  it("accepts a valid payload", () => {
    const result = LoginRequestSchema.safeParse({
      email: "pilot@topguntrading.example",
      password: "correct horse battery staple",
    });
    expect(result.success).toBe(true);
  });
});

describe("auth cookie constants", () => {
  it("are stable strings", () => {
    expect(ACCESS_TOKEN_COOKIE).toBe("tg_access");
    expect(REFRESH_TOKEN_COOKIE).toBe("tg_refresh");
  });
});
