"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
function loadEnv(schema, source = process.env) {
    const result = schema.safeParse(source);
    if (!result.success) {
        const issues = result.error.issues
            .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
            .join("\n");
        throw new Error(`TopGun Trading — invalid environment:\n${issues}\n\n` +
            `Fix the reported variables in your .env file (see .env.example at the repo root).`);
    }
    return result.data;
}
//# sourceMappingURL=env.js.map