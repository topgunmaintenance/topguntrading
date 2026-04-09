"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PACKAGE_NAME = void 0;
/**
 * TopGun Trading — @topgun/types
 *
 * Single source of truth for shared types and zod schemas.
 * Consumed by web, api, worker, and extension.
 */
__exportStar(require("./common"), exports);
__exportStar(require("./errors"), exports);
__exportStar(require("./user"), exports);
__exportStar(require("./session"), exports);
__exportStar(require("./workspace"), exports);
__exportStar(require("./auth"), exports);
__exportStar(require("./market-data"), exports);
__exportStar(require("./watchlist"), exports);
__exportStar(require("./stream"), exports);
exports.PACKAGE_NAME = "@topgun/types";
//# sourceMappingURL=index.js.map