import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Testing Library's automatic cleanup only runs when vitest globals
// are enabled. We run without globals, so wire it up explicitly.
afterEach(() => {
  cleanup();
});
