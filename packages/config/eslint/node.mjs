// @ts-check
/**
 * TopGun Trading — ESLint config for Node services (NestJS, worker).
 */
import base from "./base.mjs";
import globals from "globals";

export default [
  ...base,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // NestJS relies heavily on decorators and DI. Relax a few rules
      // that would otherwise fight the framework.
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/no-empty-function": "off",
    },
  },
];
