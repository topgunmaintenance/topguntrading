"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiErrorSchema = exports.ApiErrorCodeSchema = void 0;
const zod_1 = require("zod");
/**
 * Canonical error shape returned by the API and consumed by the web.
 * Every non-2xx response from the API conforms to this shape.
 */
exports.ApiErrorCodeSchema = zod_1.z.enum([
    "bad_request",
    "unauthorized",
    "forbidden",
    "not_found",
    "conflict",
    "unprocessable_entity",
    "rate_limited",
    "internal_error",
]);
exports.ApiErrorSchema = zod_1.z.object({
    code: exports.ApiErrorCodeSchema,
    message: zod_1.z.string(),
    /** Optional per-field validation issues, keyed by dotted path. */
    fields: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
});
//# sourceMappingURL=errors.js.map