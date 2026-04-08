import { describe, expect, it } from "vitest";
import { PasswordService } from "../src/auth/password.service";

describe("PasswordService", () => {
  const service = new PasswordService();

  it("produces a verifiable hash", async () => {
    const hash = await service.hash("correct horse battery staple");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await service.verify(hash, "correct horse battery staple")).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await service.hash("correct horse battery staple");
    expect(await service.verify(hash, "wrong password")).toBe(false);
  });

  it("returns false for a malformed hash instead of throwing", async () => {
    expect(await service.verify("not-a-hash", "whatever")).toBe(false);
  });
});
