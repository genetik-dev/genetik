# @genetik/schema

Block types, config (JSON Schema), slots, and reference modes for the Genetik JSON-driven UI ecosystem.

## Install

```bash
pnpm add @genetik/schema
```

## Usage

```ts
import {
  createSchema,
  registerBlockType,
  getBlockType,
  validateConfig,
} from "@genetik/schema";

const schema = createSchema({ version: "1.0.0" });
registerBlockType(schema, {
  id: "text",
  configSchema: { type: "object", properties: { content: { type: "string" } }, required: ["content"] },
  slots: [],
});

const result = validateConfig(schema, "text", { content: "Hello" });
// result.valid === true
```

See the [docs](https://github.com/...) or `apps/docs/docs/packages/schema.md` in the repo for full API and concepts.

## Scripts

- `pnpm build` - Build with tsdown (ESM + CJS + types)
- `pnpm test` - Run tests
- `pnpm check-types` - TypeScript check
- `pnpm lint` - ESLint
