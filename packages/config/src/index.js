"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PACKAGE_NAME = exports.loadEnv = void 0;
/**
 * TopGun Trading — @topgun/config
 *
 * Shared runtime helpers. Config files (tsconfig, eslint, prettier) are
 * resolved by tooling directly from the package directory; this module
 * exports the programmatic pieces only.
 */
var env_1 = require("./env");
Object.defineProperty(exports, "loadEnv", { enumerable: true, get: function () { return env_1.loadEnv; } });
exports.PACKAGE_NAME = "@topgun/config";
//# sourceMappingURL=index.js.map