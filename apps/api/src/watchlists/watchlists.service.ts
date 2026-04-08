import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  type CreateWatchlistRequest,
  type UpdateWatchlistRequest,
  type Watchlist,
  type WatchlistItem,
  formatSymbolRef,
  parseSymbolRef,
} from "@topgun/types";
import { PrismaService } from "../prisma/prisma.service";
import { MarketDataService } from "../market-data/market-data.service";

type WatchlistRow = {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  items: WatchlistItemRow[];
};

type WatchlistItemRow = {
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
};

@Injectable()
export class WatchlistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketData: MarketDataService,
  ) {}

  async list(userId: string): Promise<Watchlist[]> {
    const rows = (await this.prisma.watchlist.findMany({
      where: { userId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      include: {
        items: {
          orderBy: [{ position: "asc" }, { addedAt: "asc" }],
          include: { symbol: true },
        },
      },
    })) as unknown as WatchlistRow[];
    return rows.map((row) => this.toPublic(row));
  }

  async get(userId: string, watchlistId: string): Promise<Watchlist> {
    const row = (await this.prisma.watchlist.findUnique({
      where: { id: watchlistId },
      include: {
        items: {
          orderBy: [{ position: "asc" }, { addedAt: "asc" }],
          include: { symbol: true },
        },
      },
    })) as unknown as WatchlistRow | null;
    if (!row || row.userId !== userId) {
      throw new NotFoundException({
        code: "not_found",
        message: "Watchlist not found",
      });
    }
    return this.toPublic(row);
  }

  async create(userId: string, input: CreateWatchlistRequest): Promise<Watchlist> {
    const existingCount = await this.prisma.watchlist.count({ where: { userId } });
    const row = (await this.prisma.watchlist.create({
      data: {
        userId,
        name: input.name,
        isDefault: existingCount === 0,
        position: existingCount,
      },
      include: {
        items: { include: { symbol: true } },
      },
    })) as unknown as WatchlistRow;
    return this.toPublic(row);
  }

  async update(
    userId: string,
    watchlistId: string,
    input: UpdateWatchlistRequest,
  ): Promise<Watchlist> {
    await this.ensureOwned(userId, watchlistId);
    const row = (await this.prisma.watchlist.update({
      where: { id: watchlistId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.position !== undefined ? { position: input.position } : {}),
      },
      include: {
        items: {
          orderBy: [{ position: "asc" }, { addedAt: "asc" }],
          include: { symbol: true },
        },
      },
    })) as unknown as WatchlistRow;
    return this.toPublic(row);
  }

  async delete(userId: string, watchlistId: string): Promise<void> {
    await this.ensureOwned(userId, watchlistId);
    await this.prisma.watchlist.delete({ where: { id: watchlistId } });
  }

  async addItem(
    userId: string,
    watchlistId: string,
    symbolRef: string,
  ): Promise<Watchlist> {
    await this.ensureOwned(userId, watchlistId);

    // Resolve + cache the symbol metadata via the market-data service.
    const { provider } = parseSymbolRef(symbolRef);
    if (provider !== this.marketData.providerId()) {
      throw new ConflictException({
        code: "conflict",
        message: `Symbol provider ${provider} is not active on this instance`,
      });
    }
    const stored = await this.marketData.getSymbolByRef(symbolRef);

    const existingCount = await this.prisma.watchlistItem.count({
      where: { watchlistId },
    });

    try {
      await this.prisma.watchlistItem.create({
        data: {
          watchlistId,
          symbolId: stored.id,
          position: existingCount,
        },
      });
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === "P2002") {
        throw new ConflictException({
          code: "conflict",
          message: "Symbol already in this watchlist",
        });
      }
      throw error;
    }

    return this.get(userId, watchlistId);
  }

  async removeItem(
    userId: string,
    watchlistId: string,
    itemId: string,
  ): Promise<Watchlist> {
    await this.ensureOwned(userId, watchlistId);
    const item = await this.prisma.watchlistItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.watchlistId !== watchlistId) {
      throw new NotFoundException({
        code: "not_found",
        message: "Watchlist item not found",
      });
    }
    await this.prisma.watchlistItem.delete({ where: { id: itemId } });
    return this.get(userId, watchlistId);
  }

  // ---- helpers --------------------------------------------------------------

  private async ensureOwned(userId: string, watchlistId: string): Promise<void> {
    const row = await this.prisma.watchlist.findUnique({
      where: { id: watchlistId },
      select: { id: true, userId: true },
    });
    if (!row) {
      throw new NotFoundException({
        code: "not_found",
        message: "Watchlist not found",
      });
    }
    if (row.userId !== userId) {
      throw new ForbiddenException({
        code: "forbidden",
        message: "You do not own this watchlist",
      });
    }
  }

  private toPublic(row: WatchlistRow): Watchlist {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      isDefault: row.isDefault,
      position: row.position,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      items: row.items.map((item) => this.toPublicItem(item)),
    };
  }

  private toPublicItem(row: WatchlistItemRow): WatchlistItem {
    return {
      id: row.id,
      watchlistId: row.watchlistId,
      position: row.position,
      addedAt: row.addedAt.toISOString(),
      symbol: {
        ref: formatSymbolRef(row.symbol.provider, row.symbol.providerSymbol),
        provider: row.symbol.provider,
        providerSymbol: row.symbol.providerSymbol,
        assetClass: row.symbol.assetClass as WatchlistItem["symbol"]["assetClass"],
        baseAsset: row.symbol.baseAsset,
        quoteAsset: row.symbol.quoteAsset,
        displayName: row.symbol.displayName,
        minPriceIncrement: row.symbol.minPriceIncrement,
        minSizeIncrement: row.symbol.minSizeIncrement,
      },
    };
  }
}
