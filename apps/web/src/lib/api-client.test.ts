import { describe, expect, it } from "vitest";
import { ApiCallError } from "./api-client";

describe("ApiCallError", () => {
  it("exposes the status and the parsed error body", () => {
    const err = new ApiCallError(422, {
      code: "unprocessable_entity",
      message: "Request failed validation",
      fields: { email: "Invalid email" },
    });
    expect(err.status).toBe(422);
    expect(err.body.code).toBe("unprocessable_entity");
    expect(err.body.fields?.email).toBe("Invalid email");
    expect(err.message).toBe("Request failed validation");
  });
});
