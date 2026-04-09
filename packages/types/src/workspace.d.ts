import { z } from "zod";
/**
 * Workspace shape. Phase 2 keeps workspaces minimal — name and a
 * default flag. Watchlists, layouts, and default symbols land in
 * Phase 3 when the market data layer arrives.
 */
export declare const WorkspaceSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    isDefault: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    name: string;
    isDefault: boolean;
}, {
    id: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    name: string;
    isDefault: boolean;
}>;
export type Workspace = z.infer<typeof WorkspaceSchema>;
//# sourceMappingURL=workspace.d.ts.map