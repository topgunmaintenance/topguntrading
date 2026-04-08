import type {
  AdapterCapabilities,
  AttributionInfo,
  Candle,
  CandleRequest,
  Quote,
  SymbolMeta,
} from "@topgun/types";

/**
 * Handler invoked for each incoming quote tick. Handlers must be
 * fast and non-throwing — the adapter will not catch exceptions.
 */
export type QuoteHandler = (quote: Quote) => void;

/**
 * A live subscription handle. Closing the subscription must tear
 * down any upstream resources associated with it.
 */
export interface Subscription {
  readonly symbols: ReadonlySet<string>;
  close(): Promise<void>;
}

/**
 * The contract every market data provider implements. New providers
 * are added by writing a new class that implements this interface.
 * Callers never import a vendor SDK directly.
 */
export interface IMarketDataAdapter {
  readonly id: string;
  readonly capabilities: AdapterCapabilities;
  readonly attribution: AttributionInfo;

  searchSymbols(query: string, limit?: number): Promise<SymbolMeta[]>;
  getSymbol(symbol: string): Promise<SymbolMeta | null>;
  listSupportedSymbols(limit?: number): Promise<SymbolMeta[]>;

  getCandles(request: CandleRequest): Promise<Candle[]>;
  streamQuotes(symbols: string[], handler: QuoteHandler): Subscription;

  /**
   * Dispose any long-lived resources (sockets, timers). Called by
   * the registry when the process is shutting down.
   */
  dispose(): Promise<void>;
}
