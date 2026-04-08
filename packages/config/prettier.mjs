// @ts-check
/**
 * TopGun Trading — shared Prettier config.
 *
 * Consumed by every app and package via a local re-export.
 */

/** @type {import("prettier").Config} */
export default {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
};
