// @ts-check
/**
 * TopGun Trading — ESLint config for React code (web app, ui package).
 */
import base from "./base.mjs";
import globals from "globals";

export default [
  ...base,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // React / JSX rules would be added here. We intentionally keep the
      // Phase 2 set small to avoid pulling in extra plugins before we
      // need them. eslint-plugin-react + eslint-plugin-react-hooks land
      // when the UI surface grows, tracked in docs/decisions.md.
    },
  },
];
