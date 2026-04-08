import type {
  AdapterCapabilities,
  AttributionInfo,
  Candle,
  CandleRequest,
  SymbolMeta,
} from "@topgun/types";
import type { IMarketDataAdapter, QuoteHandler, Subscription } from "../contract";
import { CoinbaseRestClient, type CoinbaseRestOptions } from "./coinbase.rest";
import { CoinbaseWsClient, type CoinbaseWsOptions } from "./coinbase.ws";
import { COINBASE_PROVIDER_ID } from "./mapping";

export interface CoinbaseAdapterOptions {
  rest?: CoinbaseRestOptions;
  ws?: CoinbaseWsOptions;
  /** Override how long the in-process product list cache lasts. */
  productsTtlMs?: number;
}

const DEFAULT_PRODUCTS_TTL_MS = 5 * 60 * 1000;

/**
 * Coinbase public market-data adapter. Uses only unauthenticated
 * Coinbase Exchange endpoints and the Advanced Trade public
 * WebSocket ticker channel.
 *
 * - No API key is required.
 * - No trading capability is wired in (and never will be).
 * - Attribution must be rendered by the UI: "Data provided by Coinbase".
 */
export class CoinbaseAdapter implements IMarketDataAdapter {
  readonly id = COINBASE_PROVIDER_ID;

  readonly capabilities: AdapterCapabilities = {
    assetClasses: ["crypto"],
    intervals: ["1m", "5m", "15m", "1h", "6h", "1d"],
    streaming: { quotes: true, trades: false, level2: false },
  };

  readonly attribution: AttributionInfo = {
    provider: "coinbase",
    label: "Data provided by Coinbase",
    url: "https://www.coinbase.com/",
    delayed: false,
    simulated: false,
  };

  private readonly rest: CoinbaseRestClient;
  private readonly ws: CoinbaseWsClient;
  private readonly productsTtlMs: number;

  private productsCache: { at: number; data: SymbolMeta[] } | null = null;

  constructor(options: CoinbaseAdapterOptions = {}) {
    this.rest = new CoinbaseRestClient(options.rest);
    this.ws = new CoinbaseWsClient(options.ws);
    this.productsTtlMs = options.productsTtlMs ?? DEFAULT_PRODUCTS_TTL_MS;
  }

  async searchSymbols(query: string, limit = 20): Promise<SymbolMeta[]> {
    const products = await this.getProducts();
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, limit);
    return products
      .filter(
        (p) =>
          p.providerSymbol.toLowerCase().includes(q) ||
          p.baseAsset.toLowerCase().includes(q) ||
          p.quoteAsset.toLowerCase().includes(q) ||
          p.displayName.toLowerCase().includes(q),
      )
      .slice(0, limit);
  }

  async getSymbol(providerSymbol: string): Promise<SymbolMeta | null> {
    const products = await this.getProducts();
    const match = products.find((p) => p.providerSymbol === providerSymbol);
    if (match) return match;
    return this.rest.getProduct(providerSymbol);
  }

  async listSupportedSymbols(limit = 50): Promise<SymbolMeta[]> {
    const products = await this.getProducts();
    return products.slice(0, limit);
  }

  async getCandles(request: CandleRequest): Promise<Candle[]> {
    return this.rest.getCandles(request);
  }

  streamQuotes(symbols: string[], handler: QuoteHandler): Subscription {
    // Accept both `coinbase:BTC-USD` and `BTC-USD`; normalize to the
    // provider's native id before forwarding.
    const productIds = symbols.map((s) => (s.includes(":") ? s.slice(s.indexOf(":") + 1) : s));
    return this.ws.subscribe(productIds, handler);
  }

  async dispose(): Promise<void> {
    await this.ws.dispose();
    this.productsCache = null;
  }

  // ---- internals ------------------------------------------------------------

  private async getProducts(): Promise<SymbolMeta[]> {
    if (
      this.productsCache &&
      Date.now() - this.productsCache.at < this.productsTtlMs
    ) {
      return this.productsCache.data;
    }
    const data = await this.rest.listProducts();
    this.productsCache = { at: Date.now(), data };
    return data;
  }
}
