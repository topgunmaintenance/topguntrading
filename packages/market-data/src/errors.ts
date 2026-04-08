/**
 * Adapter-layer error. Thrown by adapters on unrecoverable failures.
 * Transient failures (network blip, single bad message) must be
 * handled internally by the adapter via retry / backoff.
 */
export class MarketDataError extends Error {
  readonly code: string;
  readonly provider: string;
  readonly cause: unknown;

  constructor(provider: string, code: string, message: string, cause?: unknown) {
    super(message);
    this.name = "MarketDataError";
    this.provider = provider;
    this.code = code;
    this.cause = cause;
  }
}
