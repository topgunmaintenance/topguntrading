import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import type { Quote, SymbolRef } from "@topgun/types";
import type { IMarketDataAdapter, Subscription } from "@topgun/market-data";
import { parseSymbolRef } from "@topgun/types";
import { MarketDataAdapterRegistry } from "./adapter.registry";

export type ClientId = string;
export type QuoteBroadcaster = (clientId: ClientId, quote: Quote) => void;

/**
 * Multiplexes client subscriptions onto a single upstream adapter
 * subscription per symbol. When the last client of a symbol goes
 * away, the upstream subscription is closed.
 *
 * Phase 3 lives in a single process. Cross-instance fan-out via
 * Redis pub/sub is Phase 6.
 */
@Injectable()
export class SubscriptionHub implements OnModuleDestroy {
  private readonly logger = new Logger(SubscriptionHub.name);

  /** symbolRef → upstream Subscription */
  private readonly upstream = new Map<SymbolRef, Subscription>();

  /** symbolRef → set of client ids interested in that symbol */
  private readonly symbolClients = new Map<SymbolRef, Set<ClientId>>();

  /** client id → set of symbols that client is subscribed to */
  private readonly clientSymbols = new Map<ClientId, Set<SymbolRef>>();

  /** client id → broadcaster function */
  private readonly broadcasters = new Map<ClientId, QuoteBroadcaster>();

  constructor(private readonly registry: MarketDataAdapterRegistry) {}

  registerClient(clientId: ClientId, broadcaster: QuoteBroadcaster): void {
    this.broadcasters.set(clientId, broadcaster);
    this.clientSymbols.set(clientId, new Set());
  }

  /**
   * Subscribe a client to one or more symbols. Symbols whose provider
   * does not match the active adapter are ignored and their
   * references returned as `skipped` so the caller can tell the
   * client why.
   */
  async subscribe(
    clientId: ClientId,
    symbols: SymbolRef[],
  ): Promise<{ accepted: SymbolRef[]; skipped: SymbolRef[] }> {
    const adapter = this.registry.get();
    const accepted: SymbolRef[] = [];
    const skipped: SymbolRef[] = [];

    for (const symbol of symbols) {
      const { provider } = parseSymbolRef(symbol);
      if (provider !== adapter.id) {
        skipped.push(symbol);
        continue;
      }
      this.attach(clientId, symbol, adapter);
      accepted.push(symbol);
    }

    return { accepted, skipped };
  }

  unsubscribe(clientId: ClientId, symbols: SymbolRef[]): void {
    for (const symbol of symbols) {
      this.detach(clientId, symbol);
    }
  }

  /**
   * Release every resource held for a client. Called from the
   * gateway's `handleDisconnect`.
   */
  unregisterClient(clientId: ClientId): void {
    const symbols = this.clientSymbols.get(clientId);
    if (symbols) {
      for (const symbol of symbols) {
        this.detach(clientId, symbol, { skipClientSet: true });
      }
    }
    this.clientSymbols.delete(clientId);
    this.broadcasters.delete(clientId);
  }

  async onModuleDestroy(): Promise<void> {
    for (const sub of this.upstream.values()) {
      try {
        await sub.close();
      } catch (error) {
        this.logger.warn(`Error closing upstream subscription: ${String(error)}`);
      }
    }
    this.upstream.clear();
    this.symbolClients.clear();
    this.clientSymbols.clear();
    this.broadcasters.clear();
  }

  // ---- internals ------------------------------------------------------------

  private attach(
    clientId: ClientId,
    symbol: SymbolRef,
    adapter: IMarketDataAdapter,
  ): void {
    if (!this.symbolClients.has(symbol)) {
      this.symbolClients.set(symbol, new Set());
      const upstream = adapter.streamQuotes([symbol], (quote) => {
        this.broadcast(quote);
      });
      this.upstream.set(symbol, upstream);
    }
    this.symbolClients.get(symbol)!.add(clientId);
    this.clientSymbols.get(clientId)?.add(symbol);
  }

  private detach(
    clientId: ClientId,
    symbol: SymbolRef,
    options: { skipClientSet?: boolean } = {},
  ): void {
    const set = this.symbolClients.get(symbol);
    if (!set) return;
    set.delete(clientId);
    if (!options.skipClientSet) {
      this.clientSymbols.get(clientId)?.delete(symbol);
    }
    if (set.size === 0) {
      this.symbolClients.delete(symbol);
      const upstream = this.upstream.get(symbol);
      this.upstream.delete(symbol);
      if (upstream) {
        void upstream.close().catch((error) => {
          this.logger.warn(
            `Failed to close upstream subscription for ${symbol}: ${String(error)}`,
          );
        });
      }
    }
  }

  private broadcast(quote: Quote): void {
    const clients = this.symbolClients.get(quote.symbol);
    if (!clients) return;
    for (const clientId of clients) {
      const broadcaster = this.broadcasters.get(clientId);
      if (!broadcaster) continue;
      try {
        broadcaster(clientId, quote);
      } catch (error) {
        this.logger.warn(`Broadcaster threw for client ${clientId}: ${String(error)}`);
      }
    }
  }

  // ---- inspection helpers (exposed for tests) -------------------------------

  /** @internal */
  _hasUpstream(symbol: SymbolRef): boolean {
    return this.upstream.has(symbol);
  }

  /** @internal */
  _clientCount(symbol: SymbolRef): number {
    return this.symbolClients.get(symbol)?.size ?? 0;
  }
}
