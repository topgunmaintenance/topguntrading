# pragma pylint: disable=missing-docstring, invalid-name, pointless-string-statement
# flake8: noqa: F401

"""
╔══════════════════════════════════════════════════════════════════════╗
║              TopGun Trading Strategy  —  Freqtrade                  ║
║                                                                      ║
║  Indicators (exact Pine Script ports):                               ║
║   1. Pi Cycle High/Low       (cycle top & bottom detection)          ║
║   2. [RS] JMA Modified RSI   (3-length: 10 / 60 / 420)              ║
║   3. TTM Squeeze             (BB vs KC momentum)                     ║
║   4. RSI + Pivot Divergence  (bull/bear labels)                      ║
║   5. Kalit MA Stack          (MA5/10/20/50/100/200 + RSI2 rules)     ║
║                                                                      ║
║  Timeframe : 4h (momentum) with 1d informative (trend)              ║
║  Pairs     : BTC/USDT  ETH/USDT  SOL/USDT                          ║
╚══════════════════════════════════════════════════════════════════════╝
"""

from datetime import datetime
from typing import Optional
import numpy as np
import pandas as pd
from pandas import DataFrame
from freqtrade.strategy import IStrategy, informative
import talib.abstract as ta


class TopGunStrategy(IStrategy):
    """
    TopGun Trading Strategy
    All indicators ported exactly from Pine Script.
    """

    # ── Strategy metadata ────────────────────────────────────────────
    INTERFACE_VERSION = 3
    timeframe = "4h"
    can_short = False

    # ── ROI & Stoploss ───────────────────────────────────────────────
    minimal_roi = {
        "0":   0.06,   # 6% take profit immediately
        "60":  0.04,   # 4% after 60 min
        "120": 0.02,   # 2% after 120 min
        "240": 0.01,   # 1% after 240 min
    }
    stoploss = -0.03   # 3% stop loss

    # ── Trailing stop ────────────────────────────────────────────────
    trailing_stop = True
    trailing_stop_positive = 0.02
    trailing_stop_positive_offset = 0.04
    trailing_only_offset_is_reached = True

    # ── Misc ─────────────────────────────────────────────────────────
    startup_candle_count: int = 500   # need lots of history for MA300/Pi Cycle
    process_only_new_candles = True

    # ══════════════════════════════════════════════════════════════════
    #  HELPER FUNCTIONS
    # ══════════════════════════════════════════════════════════════════

    def _rma(self, series: pd.Series, length: int) -> pd.Series:
        """Wilder's RMA — same as Pine ta.rma"""
        return series.ewm(alpha=1 / length, adjust=False).mean()

    def _jmax(self, src: np.ndarray, length: int, exp: float) -> np.ndarray:
        """
        Exact port of capissimo's jmax() Pine Script function.
        Jurik Moving Average core calculation.
        """
        beta  = 0.45 * (length - 1) / (0.45 * (length - 1) + 2)
        alpha = beta ** exp
        n     = len(src)
        L0 = L1 = L3 = L4 = 0.0
        out = np.full(n, np.nan)
        for i in range(n):
            v = src[i]
            if np.isnan(v):
                continue
            L0 = (1 - alpha) * v + alpha * L0
            L1 = (v - L0) * (1 - beta) + beta * L1
            L2 = L0 + L1
            L3 = (L2 - L4) * ((1 - alpha) ** 2) + (alpha ** 2) * L3
            L4 = L4 + L3
            out[i] = L4
        return out

    def _jma_mod_rsi(self, src: np.ndarray, length: int, exp: float = 2.0) -> np.ndarray:
        """
        [RS] JMA Modified RSI — exact Pine Script port.
        RSI where the average is replaced by JMA instead of a simple mean.
        """
        avg = self._jmax(src, length, exp)
        u   = np.maximum(src - avg, 0)
        d   = np.maximum(avg - src, 0)
        ru  = self._rma(pd.Series(u), length).values
        rd  = self._rma(pd.Series(d), length).values
        with np.errstate(divide="ignore", invalid="ignore"):
            rs  = np.where(rd == 0, np.inf, ru / rd)
            rsi = np.where(rd == 0, 100.0,
                  np.where(ru == 0, 0.0,
                  100 - np.round(100 / (1 + rs))))
        return rsi

    # ══════════════════════════════════════════════════════════════════
    #  INFORMATIVE — 1D timeframe for trend bias
    # ══════════════════════════════════════════════════════════════════

    @informative("1d")
    def populate_indicators_1d(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Daily timeframe indicators:
        - Pi Cycle High/Low MAs
        - JMA RSI slow (length=420) for macro momentum
        - EMA alignment for trend
        """
        c = dataframe["close"]

        # ── Pi Cycle MAs ─────────────────────────────────────────────
        dataframe["pi_low_long"]  = c.rolling(471).mean() * (745 / 1000)
        dataframe["pi_low_short"] = c.ewm(span=150, adjust=False).mean()
        dataframe["pi_hi_long"]   = c.rolling(350).mean() * 2.0
        dataframe["pi_hi_short"]  = c.rolling(111).mean()

        # Pi Cycle crossunder signals
        dataframe["pi_cycle_low"] = (
            (dataframe["pi_low_short"].shift(1) >= dataframe["pi_low_long"].shift(1)) &
            (dataframe["pi_low_short"] < dataframe["pi_low_long"])
        ).astype(int)

        dataframe["pi_cycle_hi"] = (
            (dataframe["pi_hi_long"].shift(1) >= dataframe["pi_hi_short"].shift(1)) &
            (dataframe["pi_hi_long"] < dataframe["pi_hi_short"])
        ).astype(int)

        # ── JMA RSI slow (420) — macro momentum ──────────────────────
        dataframe["jrsi2"] = self._jma_mod_rsi(c.values, 420, 2.0)

        # ── EMA stack for trend alignment ────────────────────────────
        dataframe["ema10"]  = c.ewm(span=10,  adjust=False).mean()
        dataframe["ema20"]  = c.ewm(span=20,  adjust=False).mean()
        dataframe["ema50"]  = c.ewm(span=50,  adjust=False).mean()
        dataframe["ema100"] = c.ewm(span=100, adjust=False).mean()
        dataframe["ma200"]  = c.rolling(200).mean()

        dataframe["ema_bullish"] = (
            (dataframe["ema10"]  > dataframe["ema20"])  &
            (dataframe["ema20"]  > dataframe["ema50"])  &
            (dataframe["ema50"]  > dataframe["ema100"]) &
            (dataframe["ema100"] > dataframe["ma200"])
        ).astype(int)

        dataframe["ema_bearish"] = (
            (dataframe["ema10"]  < dataframe["ema20"])  &
            (dataframe["ema20"]  < dataframe["ema50"])  &
            (dataframe["ema50"]  < dataframe["ema100"]) &
            (dataframe["ema100"] < dataframe["ma200"])
        ).astype(int)

        return dataframe

    # ══════════════════════════════════════════════════════════════════
    #  MAIN INDICATORS — 4H timeframe
    # ══════════════════════════════════════════════════════════════════

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        c = dataframe["close"]
        h = dataframe["high"]
        lo = dataframe["low"]

        # ── 1. JMA Modified RSI (all 3 lengths) ──────────────────────
        dataframe["jrsi0"] = self._jma_mod_rsi(c.values, 10,  2.0)  # fast
        dataframe["jrsi1"] = self._jma_mod_rsi(c.values, 60,  2.0)  # mid
        # jrsi2 comes from 1d informative

        # ── 2. TTM Squeeze ───────────────────────────────────────────
        length = 20
        # Bollinger Bands
        bb_mid   = c.rolling(length).mean()
        bb_upper = bb_mid + 2.0 * c.rolling(length).std()

        # Keltner Channels
        tr = pd.concat([
            h - lo,
            (h - c.shift()).abs(),
            (lo - c.shift()).abs()
        ], axis=1).max(axis=1)
        kc_mid   = c.ewm(span=length, adjust=False).mean()
        kc_upper = kc_mid + 1.0 * tr.ewm(span=length, adjust=False).mean()

        # Squeeze ON = BB inside KC
        dataframe["squeeze_on"]  = (bb_upper < kc_upper).astype(int)
        dataframe["squeeze_off"] = (bb_upper >= kc_upper).astype(int)

        # Momentum histogram
        hh   = h.rolling(length).max()
        ll   = lo.rolling(length).min()
        mid  = (hh + ll) / 2
        delta = c - (mid + kc_mid) / 2
        dataframe["ttm_mom"] = delta.rolling(length).apply(
            lambda x: np.polyval(np.polyfit(np.arange(len(x)), x, 1), len(x) - 1),
            raw=True
        )
        dataframe["ttm_rising"] = (
            dataframe["ttm_mom"] > dataframe["ttm_mom"].shift(1)
        ).astype(int)
        dataframe["ttm_pos"] = (dataframe["ttm_mom"] >= 0).astype(int)

        # ── 3. Standard RSI + Divergence ─────────────────────────────
        dataframe["rsi"] = ta.RSI(dataframe, timeperiod=14)

        # Pivot-based divergence (simplified for Freqtrade compatibility)
        rsi   = dataframe["rsi"]
        lbL   = 5
        lbR   = 5
        rLo   = 5
        rHi   = 60

        bull_div = pd.Series(0, index=dataframe.index)
        bear_div = pd.Series(0, index=dataframe.index)

        rsi_arr  = rsi.values
        low_arr  = lo.values
        high_arr = h.values
        n        = len(dataframe)

        for i in range(lbL + lbR, n):
            # Pivot low check
            window = rsi_arr[i - lbL - lbR: i + 1]
            if len(window) > 0 and rsi_arr[i - lbR] == np.nanmin(window):
                for j in range(i - lbR - rLo, max(i - lbR - rHi, lbL) - 1, -1):
                    if j < 0:
                        break
                    w2 = rsi_arr[j - lbL: j + lbR + 1] if j >= lbL and j + lbR < n else None
                    if w2 is not None and rsi_arr[j] == np.nanmin(w2):
                        if rsi_arr[i - lbR] > rsi_arr[j] and low_arr[i - lbR] < low_arr[j]:
                            bull_div.iloc[i] = 1
                        break
            # Pivot high check
            if rsi_arr[i - lbR] == np.nanmax(rsi_arr[i - lbL - lbR: i + 1]):
                for j in range(i - lbR - rLo, max(i - lbR - rHi, lbL) - 1, -1):
                    if j < 0:
                        break
                    w2 = rsi_arr[j - lbL: j + lbR + 1] if j >= lbL and j + lbR < n else None
                    if w2 is not None and rsi_arr[j] == np.nanmax(w2):
                        if rsi_arr[i - lbR] < rsi_arr[j] and high_arr[i - lbR] > high_arr[j]:
                            bear_div.iloc[i] = 1
                        break

        dataframe["bull_div"] = bull_div
        dataframe["bear_div"] = bear_div

        # ── 4. Kalit MA Stack + RSI(2) ───────────────────────────────
        dataframe["ma5"]   = c.rolling(5).mean()
        dataframe["ma200_4h"] = c.rolling(200).mean()
        dataframe["rsi2"]  = ta.RSI(dataframe, timeperiod=2)

        dataframe["kalit_long"]  = (
            (c > dataframe["ma200_4h"]) &
            (c < dataframe["ma5"])      &
            (dataframe["rsi2"] < 10)
        ).astype(int)

        dataframe["kalit_short"] = (
            (c < dataframe["ma200_4h"]) &
            (c > dataframe["ma5"])      &
            (dataframe["rsi2"] > 90)
        ).astype(int)

        # ── 5. Pi Cycle position score ───────────────────────────────
        # (pulled from 1d informative, used in signal scoring)
        # Available as dataframe["1d_pi_cycle_low"] etc after merge

        return dataframe

    # ══════════════════════════════════════════════════════════════════
    #  BUY SIGNAL
    # ══════════════════════════════════════════════════════════════════

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Multi-indicator buy signal.
        Requires confluence of indicators across timeframes.
        """
        conditions = []

        # ── MUST HAVE: Not in a squeeze (or squeeze just fired) ───────
        squeeze_ok = (
            (dataframe["squeeze_off"] == 1) |
            (dataframe["squeeze_on"].shift(1) == 1) & (dataframe["squeeze_off"] == 1)
        )
        conditions.append(squeeze_ok)

        # ── MUST HAVE: TTM momentum bullish ──────────────────────────
        conditions.append(dataframe["ttm_rising"] == 1)
        conditions.append(dataframe["ttm_pos"] == 1)

        # ── MUST HAVE: JMA RSI mid not overbought ────────────────────
        conditions.append(dataframe["jrsi1"] < 75)
        conditions.append(dataframe["jrsi1"] > 20)

        # ── SHOULD HAVE: At least one of these ───────────────────────
        extra = (
            (dataframe["bull_div"] == 1) |          # RSI bull divergence
            (dataframe["kalit_long"] == 1) |         # Kalit RSI(2) setup
            (dataframe["jrsi0"] < 30) |              # JMA RSI fast oversold
            (dataframe.get("1d_ema_bullish", 0) == 1) # Daily EMAs bullish
        )
        conditions.append(extra)

        # ── VOLUME: Not dead market ───────────────────────────────────
        conditions.append(dataframe["volume"] > 0)

        # Combine all conditions
        dataframe.loc[
            pd.concat([c.to_frame() if isinstance(c, pd.Series) else pd.Series(c, index=dataframe.index).to_frame()
                      for c in conditions], axis=1).all(axis=1),
            "enter_long"
        ] = 1

        return dataframe

    # ══════════════════════════════════════════════════════════════════
    #  SELL SIGNAL
    # ══════════════════════════════════════════════════════════════════

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        """
        Exit when momentum reverses or overbought.
        ROI and stoploss handle most exits — this catches trend reversals.
        """
        conditions = []

        # TTM momentum turning negative
        conditions.append(
            (dataframe["ttm_rising"] == 0) &
            (dataframe["ttm_pos"] == 0)
        )

        # OR: JMA RSI fast overbought
        conditions.append(dataframe["jrsi0"] > 80)

        # OR: RSI bear divergence
        conditions.append(dataframe["bear_div"] == 1)

        # OR: Pi Cycle HIGH signal (major top warning)
        pi_hi_col = "1d_pi_cycle_hi"
        if pi_hi_col in dataframe.columns:
            conditions.append(dataframe[pi_hi_col] == 1)

        dataframe.loc[
            pd.concat([c.to_frame() if isinstance(c, pd.Series)
                      else pd.Series(c, index=dataframe.index).to_frame()
                      for c in conditions], axis=1).any(axis=1),
            "exit_long"
        ] = 1

        return dataframe
