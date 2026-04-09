import node from "@topgun/config/eslint/node";

export default [
  ...node,
  {
    rules: {
      // NestJS DI containers can't always infer types statically;
      // allow a sane amount of `any` in bootstrap glue.
      "@typescript-eslint/no-explicit-any": "warn",
      // NestJS reads constructor parameter types at runtime via
      // `emitDecoratorMetadata`. Forcing service classes through
      // `import type` breaks DI silently because TypeScript elides
      // the import and `reflect-metadata` then sees `undefined`.
      // Keep service classes as value imports.
      "@typescript-eslint/consistent-type-imports": "off",
      // `!` assertions on hand-rolled Prisma mocks and short-lived
      // upstream subscription teardown are pragmatic noise here.
      // The rule still fires on a warn in shared packages.
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
];
