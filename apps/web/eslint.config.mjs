// Next.js ships its own ESLint flat config. Layer it on top of the
// shared base so we inherit project-wide rules while still getting
// next/core-web-vitals guidance.
import react from "@topgun/config/eslint/react";

export default [
  ...react,
  {
    ignores: [".next/**", "next-env.d.ts"],
  },
];
