import type { Config } from "tailwindcss";

/**
 * TopGun Trading — Tailwind 3 config.
 *
 * Design tokens live in `packages/ui/src/tokens.ts`. They are mirrored
 * into the Tailwind theme below so utility classes match the
 * programmatic tokens. If you change a token there, change it here.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    // transpile-shared UI primitives
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-base": "#0a0c10",
        "bg-raised": "#11141a",
        "bg-sunken": "#070910",
        "border-subtle": "#1f242d",
        "border-strong": "#2c3340",
        "text-primary": "#e7ecf3",
        "text-secondary": "#9aa4b2",
        "text-muted": "#5b6473",
        "accent-primary": "#ff5a1f",
        "accent-secondary": "#5ac8ff",
        "state-up": "#3ddc97",
        "state-down": "#ff4d6d",
        "state-warn": "#ffb020",
        "state-danger": "#ff4d4d",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
