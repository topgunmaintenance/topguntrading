import { z } from "zod";
/**
 * Canonical error shape returned by the API and consumed by the web.
 * Every non-2xx response from the API conforms to this shape.
 */
export declare const ApiErrorCodeSchema: z.ZodEnum<["bad_request", "unauthorized", "forbidden", "not_found", "conflict", "unprocessable_entity", "rate_limited", "internal_error"]>;
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export declare const ApiErrorSchema: z.ZodObject<{
    code: z.ZodEnum<["bad_request", "unauthorized", "forbidden", "not_found", "conflict", "unprocessable_entity", "rate_limited", "internal_error"]>;
    message: z.ZodString;
    /** Optional per-field validation issues, keyed by dotted path. */
    fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    code: "bad_request" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "unprocessable_entity" | "rate_limited" | "internal_error";
    message: string;
    fields?: Record<string, string> | undefined;
}, {
    code: "bad_request" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "unprocessable_entity" | "rate_limited" | "internal_error";
    message: string;
    fields?: Record<string, string> | undefined;
}>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
//# sourceMappingURL=errors.d.ts.map