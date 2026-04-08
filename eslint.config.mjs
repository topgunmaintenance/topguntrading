// Root ESLint config. Each app and package ships its own flat config,
// but running `eslint` at the repo root (from an editor, say) also
// picks this up — it applies the same base rules to any loose files
// at the repo root such as config files.
import base from "@topgun/config/eslint/base";

export default [
  ...base,
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "apps/extension/src/**",
      "apps/worker/src/**",
      "packages/ai-prompts/src/**",
      "packages/charting/src/**",
      "packages/market-data/src/**",
      "packages/trading-rules/src/**",
    ],
  },
];
