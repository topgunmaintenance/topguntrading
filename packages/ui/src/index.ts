/**
 * TopGun Trading — @topgun/ui
 *
 * Shared primitives. These are intentionally small in Phase 2. As the
 * product surface grows, more components land here — see
 * docs/design-system.md and packages/ui/README.md.
 */
export { cn } from "./lib/cn.js";
export { tokens, colors, radii, spacing, motion, typography, type Tokens } from "./tokens.js";
export { Button, type ButtonProps } from "./button.js";
export { Input, type InputProps } from "./input.js";
export { Label, type LabelProps } from "./label.js";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card.js";

export const PACKAGE_NAME = "@topgun/ui" as const;
