import type {
  CreateWatchlistRequest,
  SymbolRef,
  UpdateWatchlistRequest,
  Watchlist,
} from "@topgun/types";
import { env } from "./env";
import { ApiCallError } from "./api-client";

async function call<T>(
  path: string,
  init: RequestInit & { cookie?: string } = {},
): Promise<T> {
  const { cookie, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("accept", "application/json");
  headers.set("content-type", "application/json");
  if (cookie) headers.set("cookie", cookie);

  const response = await fetch(`${env.API_INTERNAL_URL}${path}`, {
    ...rest,
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = { code: "internal_error", message: `API ${response.status}` };
    }
    throw new ApiCallError(response.status, body as never);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const watchlistsClient = {
  async list(cookie?: string): Promise<Watchlist[]> {
    const { watchlists } = await call<{ watchlists: Watchlist[] }>("/watchlists", {
      cookie,
    });
    return watchlists;
  },

  async get(id: string, cookie?: string): Promise<Watchlist> {
    const { watchlist } = await call<{ watchlist: Watchlist }>(`/watchlists/${id}`, {
      cookie,
    });
    return watchlist;
  },

  async create(
    input: CreateWatchlistRequest,
    cookie?: string,
  ): Promise<Watchlist> {
    const { watchlist } = await call<{ watchlist: Watchlist }>("/watchlists", {
      method: "POST",
      body: JSON.stringify(input),
      cookie,
    });
    return watchlist;
  },

  async update(
    id: string,
    input: UpdateWatchlistRequest,
    cookie?: string,
  ): Promise<Watchlist> {
    const { watchlist } = await call<{ watchlist: Watchlist }>(`/watchlists/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      cookie,
    });
    return watchlist;
  },

  async delete(id: string, cookie?: string): Promise<void> {
    await call<void>(`/watchlists/${id}`, { method: "DELETE", cookie });
  },

  async addItem(id: string, symbol: SymbolRef, cookie?: string): Promise<Watchlist> {
    const { watchlist } = await call<{ watchlist: Watchlist }>(
      `/watchlists/${id}/items`,
      {
        method: "POST",
        body: JSON.stringify({ symbol }),
        cookie,
      },
    );
    return watchlist;
  },

  async removeItem(
    id: string,
    itemId: string,
    cookie?: string,
  ): Promise<Watchlist> {
    const { watchlist } = await call<{ watchlist: Watchlist }>(
      `/watchlists/${id}/items/${itemId}`,
      { method: "DELETE", cookie },
    );
    return watchlist;
  },
};
