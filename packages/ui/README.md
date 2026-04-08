# @topgun/ui

Shared UI primitives for the web app (and, later, the browser
extension). Built on Tailwind utilities and `class-variance-authority`.

## Phase 2 contents

- `tokens` — colors, radii, spacing, motion, typography (mirrors
  `docs/design-system.md`)
- `cn` — safe Tailwind class merge helper (`clsx` + `tailwind-merge`)
- `Button` — primary, secondary, ghost, danger; sm/md/lg/icon
- `Input`
- `Label`
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`,
  `CardFooter`

## Later phases

More primitives (Tabs, Popover, Dialog, Toast, Command palette, Table,
Skeleton, Empty state) land as the product surface grows. We resist
adding anything before we use it.

## Testing

Vitest + Testing Library, jsdom environment. Run from the repo root:

```bash
pnpm --filter @topgun/ui test
```

## Owner

Designer + Frontend Lead.
