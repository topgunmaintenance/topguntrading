/**
 * TopGun Trading — design tokens.
 *
 * These mirror docs/design-system.md. They are exported as JS so that
 * Tailwind configs, Next.js pages, and Storybook (when it lands) can
 * all reference a single source of truth. Changing a value here
 * changes it everywhere it is consumed.
 */
export const colors = {
  bg: {
    base: "#0a0c10",
    raised: "#11141a",
    sunken: "#070910",
  },
  border: {
    subtle: "#1f242d",
    strong: "#2c3340",
  },
  text: {
    primary: "#e7ecf3",
    secondary: "#9aa4b2",
    muted: "#5b6473",
  },
  accent: {
    primary: "#ff5a1f",
    secondary: "#5ac8ff",
  },
  state: {
    up: "#3ddc97",
    down: "#ff4d6d",
    warn: "#ffb020",
    danger: "#ff4d4d",
  },
} as const;

export const radii = {
  sm: "4px",
  md: "6px",
  lg: "10px",
  xl: "16px",
  pill: "999px",
} as const;

export const spacing = {
  px: "1px",
  0.5: "2px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  14: "56px",
  20: "80px",
} as const;

export const motion = {
  fast: "120ms",
  default: "160ms",
  slow: "200ms",
  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
} as const;

export const typography = {
  fontFamily: {
    ui: `'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`,
    mono: `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`,
  },
  featureSettings: {
    tabular: `"tnum" 1, "cv11" 1`,
  },
} as const;

export const tokens = {
  colors,
  radii,
  spacing,
  motion,
  typography,
} as const;

export type Tokens = typeof tokens;
