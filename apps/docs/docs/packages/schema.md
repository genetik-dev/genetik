---
sidebar_position: 1
---

# @decal/schema

The schema package is the foundation of the Decal ecosystem. It defines block types, their config (JSON Schema), and slots with reference modes. Other packages (@decal/content, @decal/renderer, @decal/builder, etc.) depend on it.

## Concepts

- **Block type**: A named definition (e.g. `text`, `card`, `hero`) with a **config schema** (JSON Schema) and **slots**.
- **Slot**: A named place for child nodes. Each slot has:
  - **name** (e.g. `children`, `header`)
  - **multiple**: whether it holds one node or an ordered list
  - **referenceMode**: `"id"` (ids only), `"inline"` (inline nodes only), or `"both"`
- **Schema**: A registry of block types, plus optional metadata (e.g. version for migrations).

## Installation

```bash
pnpm add @decal/schema
```

## Usage

### Create a schema and register block types

```ts
import {
  createSchema,
  registerBlockType,
  getBlockType,
  validateConfig,
} from "@decal/schema";

const schema = createSchema({ version: "1.0.0" });

registerBlockType(schema, {
  name: "text",
  configSchema: {
    type: "object",
    properties: { content: { type: "string" } },
    required: ["content"],
  },
  slots: [],
});

registerBlockType(schema, {
  name: "card",
  configSchema: {
    type: "object",
    properties: { title: { type: "string" } },
  },
  slots: [
    { name: "children", multiple: true, referenceMode: "both" },
  ],
});
```

### Look up a block type

```ts
const textBlock = getBlockType(schema, "text");
// use textBlock.configSchema, textBlock.slots, etc.
```

### Validate block config

```ts
const result = validateConfig(schema, "text", { content: "Hello" });
if (result.valid) {
  // config is valid
} else {
  console.error(result.errors);
}
```

## API summary

| Export | Description |
|--------|-------------|
| `createSchema(meta?)` | Create an empty schema. |
| `registerBlockType(schema, blockType)` | Register a block type. |
| `getBlockType(schema, name)` | Get a block type by name. |
| `hasBlockType(schema, name)` | Check if a block type exists. |
| `getBlockTypeNames(schema)` | List all registered block type names. |
| `validateConfig(schema, blockTypeName, config)` | Validate config against the block type's JSON Schema. |
| `validateConfigAgainstDefinition(blockType, config)` | Validate config when you already have the block type definition. |

Types: `BlockTypeDefinition`, `SlotDefinition`, `SlotReferenceMode`, `DecalSchema`, `SchemaMeta`, `JsonSchema`, `ValidationResult`.

## Package location and build

Source: `packages/schema` in the monorepo. The package is built with [tsdown](https://tsdown.dev/) (ESM + CJS + types). Run `pnpm build` from the package directory or `pnpm --filter @decal/schema build` from the repo root.
