import { config } from "@genetik/eslint-config/base";

/** @type {import("eslint").Linter.Config[]} */
export default [...config, { ignores: ["dist/**"] }];
