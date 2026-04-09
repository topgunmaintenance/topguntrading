import { z } from "zod";
export declare const WatchlistItemSchema: z.ZodObject<{
    id: z.ZodString;
    watchlistId: z.ZodString;
    symbol: z.ZodObject<{
        ref: z.ZodString;
        provider: z.ZodString;
        providerSymbol: z.ZodString;
        assetClass: z.ZodEnum<["crypto", "equity", "futures", "fx"]>;
        baseAsset: z.ZodString;
        quoteAsset: z.ZodString;
        displayName: z.ZodString;
        minPriceIncrement: z.ZodNullable<z.ZodString>;
        minSizeIncrement: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        displayName: string;
        ref: string;
        provider: string;
        providerSymbol: string;
        assetClass: "crypto" | "equity" | "futures" | "fx";
        baseAsset: string;
        quoteAsset: string;
        minPriceIncrement: string | null;
        minSizeIncrement: string | null;
    }, {
        displayName: string;
        ref: string;
        provider: string;
        providerSymbol: string;
        assetClass: "crypto" | "equity" | "futures" | "fx";
        baseAsset: string;
        quoteAsset: string;
        minPriceIncrement: string | null;
        minSizeIncrement: string | null;
    }>;
    position: z.ZodNumber;
    addedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    symbol: {
        displayName: string;
        ref: string;
        provider: string;
        providerSymbol: string;
        assetClass: "crypto" | "equity" | "futures" | "fx";
        baseAsset: string;
        quoteAsset: string;
        minPriceIncrement: string | null;
        minSizeIncrement: string | null;
    };
    id: string;
    watchlistId: string;
    position: number;
    addedAt: string;
}, {
    symbol: {
        displayName: string;
        ref: string;
        provider: string;
        providerSymbol: string;
        assetClass: "crypto" | "equity" | "futures" | "fx";
        baseAsset: string;
        quoteAsset: string;
        minPriceIncrement: string | null;
        minSizeIncrement: string | null;
    };
    id: string;
    watchlistId: string;
    position: number;
    addedAt: string;
}>;
export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;
export declare const WatchlistSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    isDefault: z.ZodBoolean;
    position: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        watchlistId: z.ZodString;
        symbol: z.ZodObject<{
            ref: z.ZodString;
            provider: z.ZodString;
            providerSymbol: z.ZodString;
            assetClass: z.ZodEnum<["crypto", "equity", "futures", "fx"]>;
            baseAsset: z.ZodString;
            quoteAsset: z.ZodString;
            displayName: z.ZodString;
            minPriceIncrement: z.ZodNullable<z.ZodString>;
            minSizeIncrement: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            displayName: string;
            ref: string;
            provider: string;
            providerSymbol: string;
            assetClass: "crypto" | "equity" | "futures" | "fx";
            baseAsset: string;
            quoteAsset: string;
            minPriceIncrement: string | null;
            minSizeIncrement: string | null;
        }, {
            displayName: string;
            ref: string;
            provider: string;
            providerSymbol: string;
            assetClass: "crypto" | "equity" | "futures" | "fx";
            baseAsset: string;
            quoteAsset: string;
            minPriceIncrement: string | null;
            minSizeIncrement: string | null;
        }>;
        position: z.ZodNumber;
        addedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        symbol: {
            displayName: string;
            ref: string;
            provider: string;
            providerSymbol: string;
            assetClass: "crypto" | "equity" | "futures" | "fx";
            baseAsset: string;
            quoteAsset: string;
            minPriceIncrement: string | null;
            minSizeIncrement: string | null;
        };
        id: string;
        watchlistId: string;
        position: number;
        addedAt: string;
    }, {
        symbol: {
            displayName: string;
            ref: string;
            provider: string;
            providerSymbol: string;
            assetClass: "crypto" | "equity" | "futures" | "fx";
            baseAsset: string;
            quoteAsset: string;
            minPriceIncrement: string | null;
            minSizeIncrement: string | null;
        };
        id: string;
        watchlistId: string;
        position: number;
        addedAt: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    name: string;
    isDefault: boolean;
    position: number;
    items: {
        symbol: {
            displayName: string;
            ref: string;
            provider: string;
            providerSymbol: string;
            assetClass: "crypto" | "equity" | "futures" | "fx";
            baseAsset: string;
            quoteAsset: string;
            minPriceIncrement: string | null;
            minSizeIncrement: string | null;
        };
        id: string;
        watchlistId: string;
        position: number;
        addedAt: string;
    }[];
}, {
    id: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    name: string;
    isDefault: boolean;
    position: number;
    items: {
        symbol: {
            displayName: string;
            ref: string;
            provider: string;
            providerSymbol: string;
            assetClass: "crypto" | "equity" | "futures" | "fx";
            baseAsset: string;
            quoteAsset: string;
            minPriceIncrement: string | null;
            minSizeIncrement: string | null;
        };
        id: string;
        watchlistId: string;
        position: number;
        addedAt: string;
    }[];
}>;
export type Watchlist = z.infer<typeof WatchlistSchema>;
export declare const CreateWatchlistRequestSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export type CreateWatchlistRequest = z.infer<typeof CreateWatchlistRequestSchema>;
export declare const UpdateWatchlistRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    position?: number | undefined;
}, {
    name?: string | undefined;
    position?: number | undefined;
}>;
export type UpdateWatchlistRequest = z.infer<typeof UpdateWatchlistRequestSchema>;
export declare const AddWatchlistItemRequestSchema: z.ZodObject<{
    symbol: z.ZodString;
}, "strip", z.ZodTypeAny, {
    symbol: string;
}, {
    symbol: string;
}>;
export type AddWatchlistItemRequest = z.infer<typeof AddWatchlistItemRequestSchema>;
//# sourceMappingURL=watchlist.d.ts.map