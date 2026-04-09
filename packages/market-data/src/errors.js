"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDataError = void 0;
/**
 * Adapter-layer error. Thrown by adapters on unrecoverable failures.
 * Transient failures (network blip, single bad message) must be
 * handled internally by the adapter via retry / backoff.
 */
class MarketDataError extends Error {
    code;
    provider;
    cause;
    constructor(provider, code, message, cause) {
        super(message);
        this.name = "MarketDataError";
        this.provider = provider;
        this.code = code;
        this.cause = cause;
    }
}
exports.MarketDataError = MarketDataError;
//# sourceMappingURL=errors.js.map