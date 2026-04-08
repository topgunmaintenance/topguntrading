import node from "@topgun/config/eslint/node";

export default [
  ...node,
  {
    rules: {
      // NestJS DI containers can't always infer types statically;
      // allow a sane amount of `any` in bootstrap glue.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
