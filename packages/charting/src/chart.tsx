"use client";

import { useEffect, useMemo, useRef } from "react";
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  UTCTimestamp,
} from "lightweight-charts";
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";
import type { Candle, Interval, Quote } from "@topgun/types";

export interface ChartProps {
  /** Initial candles rendered on mount and whenever `symbol`/`interval` changes. */
  candles: Candle[];
  symbol: string;
  interval: Interval;
  /**
   * Optional live quote used to refresh the most recent candle. The
   * chart component never mutates the `candles` array — updates come
   * through this prop.
   */
  liveQuote?: Quote | null;
  height?: number;
  className?: string;
}

/**
 * Dark-themed candlestick chart built on lightweight-charts.
 *
 * Client-only. The web app should import this behind a dynamic import
 * with `{ ssr: false }` to avoid SSR crashes (lightweight-charts
 * touches `window` at module load).
 */
export function Chart({
  candles,
  symbol,
  interval,
  liveQuote,
  height = 420,
  className,
}: ChartProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const initialData = useMemo(() => candles.map(candleToLWC), [candles]);

  // Create chart once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#0a0c10" },
        textColor: "#9aa4b2",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      },
      grid: {
        vertLines: { color: "#1f242d" },
        horzLines: { color: "#1f242d" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        borderColor: "#2c3340",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "#2c3340",
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#3ddc97",
      downColor: "#ff4d6d",
      borderUpColor: "#3ddc97",
      borderDownColor: "#ff4d6d",
      wickUpColor: "#3ddc97",
      wickDownColor: "#ff4d6d",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = (): void => {
      if (container) {
        chart.applyOptions({ width: container.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // We intentionally omit `height` — applying height changes is
    // cheap and handled by `autoSize`. The chart is rebuilt only on
    // first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap in new candles whenever `symbol`, `interval`, or the array changes.
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    series.setData(initialData);
    chartRef.current?.timeScale().fitContent();
  }, [initialData, symbol, interval]);

  // Apply a live quote to the most recent candle, if any.
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !liveQuote || !liveQuote.last) return;
    const last = Number(liveQuote.last);
    if (!Number.isFinite(last)) return;

    const lastCandle = initialData.at(-1);
    if (!lastCandle) return;

    series.update({
      time: lastCandle.time,
      open: lastCandle.open,
      high: Math.max(lastCandle.high, last),
      low: Math.min(lastCandle.low, last),
      close: last,
    });
  }, [liveQuote, initialData]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height }}
      aria-label={`Candlestick chart for ${symbol} at ${interval}`}
      role="img"
    />
  );
}

function candleToLWC(candle: Candle): CandlestickData<UTCTimestamp> {
  const seconds = Math.floor(new Date(candle.openTime).getTime() / 1000) as UTCTimestamp;
  return {
    time: seconds,
    open: Number(candle.open),
    high: Number(candle.high),
    low: Number(candle.low),
    close: Number(candle.close),
  };
}
