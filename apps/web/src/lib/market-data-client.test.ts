import { describe, expect, it } from "vitest";
import { ApiCallError } from "./api-client";

describe("market-data-client error path", () => {
  it("ApiCallError preserves status and body (shared with market-data-client)", () => {
    const err = new ApiCallError(429, {
      code: "rate_limited",
      message: "Upstream rate limit",
    });
    expect(err.status).toBe(429);
    expect(err.body.code).toBe("rate_limited");
  });
});
