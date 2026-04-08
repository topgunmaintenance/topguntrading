import { z } from "zod";

/**
 * Canonical error shape returned by the API and consumed by the web.
 * Every non-2xx response from the API conforms to this shape.
 */
export const ApiErrorCodeSchema = z.enum([
  "bad_request",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "unprocessable_entity",
  "rate_limited",
  "internal_error",
]);

export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export const ApiErrorSchema = z.object({
  code: ApiErrorCodeSchema,
  message: z.string(),
  /** Optional per-field validation issues, keyed by dotted path. */
  fields: z.record(z.string(), z.string()).optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
