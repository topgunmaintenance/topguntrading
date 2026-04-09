import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./lib/cn.js";

/**
 * TopGun Trading — DataDisclaimer primitive.
 *
 * Phase 3.5 (ADR-0027). Mounted on every data surface that renders
 * third-party market data. Non-advice disclaimer required by
 * docs/compliance.md §Plain-language disclaimers. Attribution string
 * is supplied per-provider from `AttributionInfo.label`.
 *
 * Visual: muted, small, monospace provider name, ambient footer.
 * No exclamation marks. No emoji. No color other than muted.
 *
 * Usage:
 *   <DataDisclaimer providerLabel="Kraken public feed" delayNote="Delayed" />
 */
export interface DataDisclaimerProps extends HTMLAttributes<HTMLDivElement> {
  /** Human-readable provider name, e.g. "Kraken public feed". */
  providerLabel: string;
  /** Optional delay note, e.g. "Delayed ~15m". Rendered inline. */
  delayNote?: string;
}

export const DataDisclaimer = forwardRef<HTMLDivElement, DataDisclaimerProps>(
  ({ className, providerLabel, delayNote, ...props }, ref) => (
    <div
      ref={ref}
      role="note"
      className={cn(
        "flex flex-wrap items-center gap-x-1 text-[11px] leading-tight text-text-muted",
        className,
      )}
      {...props}
    >
      <span>Data via</span>
      <span className="font-mono text-text-secondary">{providerLabel}</span>
      {delayNote ? <span>— {delayNote}</span> : null}
      <span className="mx-1 text-text-muted/50">·</span>
      <span>Not investment advice. Past results are not indicative of future results.</span>
    </div>
  ),
);
DataDisclaimer.displayName = "DataDisclaimer";
