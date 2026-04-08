import { beforeEach, describe, expect, it, vi } from "vitest";
import { WatchlistsService } from "../src/watchlists/watchlists.service";
import type { MarketDataService } from "../src/market-data/market-data.service";

type StoredSymbol = {
  id: string;
  provider: string;
  providerSymbol: string;
  assetClass: string;
  baseAsset: string;
  quoteAsset: string;
  displayName: string;
  minPriceIncrement: string | null;
  minSizeIncrement: string | null;
  lastSyncedAt: string;
  ref: `${string}:${string}`;
};

type WatchlistRow = {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    watchlistId: string;
    position: number;
    addedAt: Date;
    symbol: {
      id: string;
      provider: string;
      providerSymbol: string;
      assetClass: string;
      baseAsset: string;
      quoteAsset: string;
      displayName: string;
      minPriceIncrement: string | null;
      minSizeIncrement: string | null;
    };
  }>;
};

function makePrisma() {
  const watchlists = new Map<string, WatchlistRow>();
  const itemsByWatchlist = new Map<string, WatchlistRow["items"]>();
  let wlSeq = 0;
  let itemSeq = 0;

  const storedSymbol = {
    id: "sym_1",
    provider: "mock",
    providerSymbol: "BTC-USD",
    assetClass: "crypto",
    baseAsset: "BTC",
    quoteAsset: "USD",
    displayName: "Bitcoin / US Dollar",
    minPriceIncrement: "0.01",
    minSizeIncrement: "0.00000001",
  };

  const prisma = {
    watchlist: {
      count: vi.fn(async ({ where }: { where: { userId: string } }) => {
        return Array.from(watchlists.values()).filter(
          (w) => w.userId === where.userId,
        ).length;
      }),
      create: vi.fn(async ({ data }: { data: Partial<WatchlistRow> }) => {
        const id = `wl_${++wlSeq}`;
        const row: WatchlistRow = {
          id,
          userId: data.userId!,
          name: data.name!,
          isDefault: data.isDefault ?? false,
          position: data.position ?? 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
        };
        watchlists.set(id, row);
        itemsByWatchlist.set(id, []);
        return row;
      }),
      findMany: vi.fn(
        async ({ where }: { where: { userId: string } }) => {
          const rows = Array.from(watchlists.values())
            .filter((w) => w.userId === where.userId)
            .map((w) => ({ ...w, items: itemsByWatchlist.get(w.id) ?? [] }));
          return rows;
        },
      ),
      findUnique: vi.fn(
        async ({
          where,
        }: {
          where: { id: string };
          select?: unknown;
          include?: unknown;
        }) => {
          const w = watchlists.get(where.id);
          if (!w) return null;
          return { ...w, items: itemsByWatchlist.get(w.id) ?? [] };
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<WatchlistRow>;
        }) => {
          const row = watchlists.get(where.id);
          if (!row) throw new Error("not found");
          const updated = { ...row, ...data, updatedAt: new Date() };
          watchlists.set(where.id, updated);
          return { ...updated, items: itemsByWatchlist.get(row.id) ?? [] };
        },
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        watchlists.delete(where.id);
        itemsByWatchlist.delete(where.id);
      }),
    },
    watchlistItem: {
      count: vi.fn(
        async ({ where }: { where: { watchlistId: string } }) =>
          itemsByWatchlist.get(where.watchlistId)?.length ?? 0,
      ),
      create: vi.fn(
        async ({
          data,
        }: {
          data: { watchlistId: string; symbolId: string; position: number };
        }) => {
          const list = itemsByWatchlist.get(data.watchlistId) ?? [];
          if (list.some((it) => it.symbol.id === data.symbolId)) {
            const err = new Error("unique violation") as Error & { code: string };
            err.code = "P2002";
            throw err;
          }
          const item = {
            id: `wli_${++itemSeq}`,
            watchlistId: data.watchlistId,
            position: data.position,
            addedAt: new Date(),
            symbol: { ...storedSymbol },
          };
          list.push(item);
          itemsByWatchlist.set(data.watchlistId, list);
          return item;
        },
      ),
      findUnique: vi.fn(
        async ({ where }: { where: { id: string } }) => {
          for (const list of itemsByWatchlist.values()) {
            const found = list.find((it) => it.id === where.id);
            if (found) return { ...found, watchlistId: found.watchlistId };
          }
          return null;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        for (const [wl, list] of itemsByWatchlist) {
          const idx = list.findIndex((it) => it.id === where.id);
          if (idx >= 0) {
            list.splice(idx, 1);
            itemsByWatchlist.set(wl, list);
            return;
          }
        }
      }),
    },
  };

  return { prisma, storedSymbol };
}

function makeMarketData(storedSymbol: { id: string }): MarketDataService {
  const fullStored: StoredSymbol = {
    id: storedSymbol.id,
    provider: "mock",
    providerSymbol: "BTC-USD",
    assetClass: "crypto",
    baseAsset: "BTC",
    quoteAsset: "USD",
    displayName: "Bitcoin / US Dollar",
    minPriceIncrement: "0.01",
    minSizeIncrement: "0.00000001",
    lastSyncedAt: new Date().toISOString(),
    ref: "mock:BTC-USD",
  };
  return {
    providerId: () => "mock",
    getSymbolByRef: vi.fn(async () => fullStored),
  } as unknown as MarketDataService;
}

describe("WatchlistsService", () => {
  let prisma: ReturnType<typeof makePrisma>["prisma"];
  let marketData: MarketDataService;
  let service: WatchlistsService;

  beforeEach(() => {
    const setup = makePrisma();
    prisma = setup.prisma;
    marketData = makeMarketData(setup.storedSymbol);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new WatchlistsService(prisma as any, marketData);
  });

  it("creates the first watchlist as default", async () => {
    const wl = await service.create("user_1", { name: "Crypto" });
    expect(wl.isDefault).toBe(true);
    expect(wl.name).toBe("Crypto");
    expect(wl.items).toHaveLength(0);
  });

  it("makes subsequent watchlists non-default", async () => {
    await service.create("user_1", { name: "Crypto" });
    const wl = await service.create("user_1", { name: "Alts" });
    expect(wl.isDefault).toBe(false);
  });

  it("adds an item and returns the full watchlist", async () => {
    const created = await service.create("user_1", { name: "Crypto" });
    const updated = await service.addItem("user_1", created.id, "mock:BTC-USD");
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0]?.symbol.ref).toBe("mock:BTC-USD");
  });

  it("refuses duplicate symbols with a 409", async () => {
    const created = await service.create("user_1", { name: "Crypto" });
    await service.addItem("user_1", created.id, "mock:BTC-USD");
    await expect(
      service.addItem("user_1", created.id, "mock:BTC-USD"),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("refuses access to another user's watchlist", async () => {
    const created = await service.create("user_1", { name: "Crypto" });
    await expect(service.get("user_2", created.id)).rejects.toMatchObject({
      status: 404,
    });
  });
});
