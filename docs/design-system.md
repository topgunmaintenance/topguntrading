# Design System

The TopGun Trading design system is dark, dense, and professional. Think
"flight deck," not "fintech splash page." Color is structural, not decorative.

## Tokens

### Color (dark, default)
- `bg.base` — `#0a0c10` near-black, matte
- `bg.raised` — `#11141a`
- `bg.sunken` — `#070910`
- `border.subtle` — `#1f242d`
- `border.strong` — `#2c3340`
- `text.primary` — `#e7ecf3`
- `text.secondary` — `#9aa4b2`
- `text.muted` — `#5b6473`
- `accent.primary` — `#ff5a1f` ("afterburner orange")
- `accent.secondary` — `#5ac8ff` ("hud cyan")
- `state.up` — `#3ddc97` (long / bullish)
- `state.down` — `#ff4d6d` (short / bearish)
- `state.warn` — `#ffb020`
- `state.danger` — `#ff4d4d`

Light mode is **not** a Phase 1 deliverable. We will design tokens with a
light variant in mind, but ship dark first.

### Typography
- Display: Inter Display (or system fallback) — used sparingly
- UI: Inter — primary
- Mono: JetBrains Mono — numbers, prices, code
- Numeric: tabular figures everywhere price/PnL appears

### Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 56, 80
- Dense layouts use 4–12; spacious layouts use 16–32

### Radius
- `sm` 4px, `md` 6px, `lg` 10px, `xl` 16px, `pill` 999px
- Default for cards: `md`

### Elevation
- Flat by default. Borders carry hierarchy.
- Real shadows are reserved for popovers, dialogs, command palette.

## Components (Phase 2 targets)

- Button (primary, secondary, ghost, danger, icon)
- Input, Textarea, Select, Combobox, Checkbox, Radio, Switch
- Card, Panel, Section, Toolbar
- Tabs, Segmented control
- Tooltip, Popover, Dialog, Drawer, Sheet
- Toast / Notification
- Table (dense + comfortable)
- Command palette (`Cmd+K`)
- Empty state
- Skeleton loaders
- Chart container with floating toolbar
- Watchlist row
- Journal entry card
- Rule chip
- AI message bubble (with disclaimer slot)

All components live in `packages/ui` and are built on shadcn/ui where useful.

## Voice and microcopy

- Direct, calm, technical.
- No exclamation marks. No emojis. No "Awesome!" / "Oops!"
- Errors are explained, not apologized for.
- Numbers are formatted with locale-aware separators and tabular figures.
- "Buy" and "Sell" are reserved for actual order intent (which we do not
  execute). Use "Long" / "Short" for direction in journals and analysis.

## Motion

- Subtle and fast. 120–180ms is the default.
- No bouncing, no spring overshoot in financial surfaces.
- Reduced-motion preference is fully respected.

## Accessibility

- Color contrast meets WCAG AA against `bg.base` and `bg.raised` for all
  text and meaningful UI.
- All interactive elements have keyboard focus rings.
- No information is conveyed by color alone (always paired with shape,
  label, or icon).
- The command palette and primary navigation are fully keyboard-driven.

## Iconography

- Lucide icon set as the default.
- Custom icons for asset classes and proprietary patterns live in
  `packages/ui/icons`.

## Open decisions

Tracked in [`docs/decisions.md`](decisions.md):

- Final accent color (afterburner orange vs. ice white vs. radar green)
- Whether to ship a "high-density" toggle for ultra-compact layouts
