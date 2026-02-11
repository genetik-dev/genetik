---
sidebar_position: 1
---

# @genetik/schema

The schema package is the foundation of the Genetik ecosystem. It uses its own config API (not raw JSON Schema) and returns a schema with getters plus a **contentSchema** (JSON Schema for the content document). Other packages (@genetik/content, @genetik/renderer, @genetik/builder, etc.) depend on it.

## Concepts

- **Config API**: `createSchema({ registerBlocks, registerPlugins, version, options })` — distinct from JSON Schema; plugins can register blocks and add options.
- **Block input**: When registering a block you supply **name**, **configSchema** (JSON Schema for that block's config), and **slots** with **name** and **multiple**. You can set **addable: false** so the block cannot be added from the palette or "+ Add block" (e.g. a root-only "page" block). Slots can optionally include **layout** (`"row"` | `"column"`) so the editor’s slot drop target matches the block’s layout (e.g. a row block’s children slot uses `layout: "row"` so columns render horizontally in the canvas). Slots can restrict allowed block types: **includeBlockNames** (only these types) or **excludeBlockNames** (exclude these); only one should be set. You can set **default** (or **defaultValue**) on config properties; when a block is added in the editor, `@genetik/editor`'s `getDefaultConfig` uses those values for the new block's config. You can set **editorInput** on a property (`"text"` | `"number"` | `"textarea"` | `"checkbox"`) so the editor side panel renders a matching form field instead of raw JSON; if omitted, the editor infers from the property's **type** (string → text, number → number, boolean → checkbox).
- **Global reference mode**: **slotReferenceMode** is a schema-level option (`"id"` | `"inline"` | `"both"`). It applies to all slots. Default is `"id"`.
- **Plugins**: Build-time only. A plugin receives a context and can `registerBlock(block)` and read/mutate `options`.
- **Return value**: The schema instance has `blockTypes`, `meta`, **contentSchema** (JSON Schema for content), **options**, **version**, and getters: `getBlockType(name)`, `getBlockTypeNames()`, `hasBlockType(name)`.

## Installation

```bash
pnpm add @genetik/schema
```

## Usage

### Create a schema from config

```ts
import {
  createSchema,
  getBlockType,
  validateConfig,
} from "@genetik/schema";

const schema = createSchema({
  version: "1.0.0",
  registerBlocks: [
    {
      name: "text",
      configSchema: {
        type: "object",
        properties: { content: { type: "string" } },
        required: ["content"],
      },
      slots: [],
    },
    {
      name: "card",
      configSchema: {
        type: "object",
        properties: { title: { type: "string", default: "hello world" } },
      },
      slots: [{ name: "children", multiple: true }],
    },
  ],
  options: { slotReferenceMode: "both" }, // optional; default "id"
});
```

### Plugins

Plugins run in order and can register blocks and add options.

```ts
const schema = createSchema({
  registerBlocks: [textBlock],
  registerPlugins: [
    (ctx) => {
      ctx.registerBlock({ name: "card", configSchema: {}, slots: [{ name: "children", multiple: true }] });
      ctx.options.myOption = "value";
    },
  ],
  version: "1.0.0",
});
```

### Getters and contentSchema

```ts
schema.getBlockType("text");   // block type definition (slots have referenceMode from options)
schema.getBlockTypeNames();    // ["text", "card"]
schema.hasBlockType("text");   // true
schema.contentSchema;          // JSON Schema for the content document (entryId + nodes)
schema.options;                // { slotReferenceMode: "both", ... }
schema.version;                // "1.0.0"
```

Standalone functions still work: `getBlockType(schema, "text")`, etc.

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
| `createSchema(config)` | Create a schema. Config: `registerBlocks`, `registerPlugins`, `version`, `options`. Returns schema instance with getters and `contentSchema`. |
| `getBlockType(schema, name)` | Get a block type by name. |
| `hasBlockType(schema, name)` | Check if a block type exists. |
| `getBlockTypeNames(schema)` | List all registered block type names. |
| `validateConfig(schema, blockTypeName, config)` | Validate config against the block type's JSON Schema. |
| `validateConfigAgainstDefinition(blockType, config)` | Validate config when you already have the block type definition. |

Types: `BlockInput`, `BlockTypeDefinition`, `SlotInput`, `SlotDefinition`, `SlotLayoutHint`, `SlotReferenceMode`, `SchemaConfig`, `SchemaOptions`, `SchemaPlugin`, `SchemaPluginContext`, `SchemaInstance`, `GenetikSchema`, `SchemaMeta`, `JsonSchema`, `ValidationResult`.

## Package location and build

Source: `packages/schema` in the monorepo. The package is built with [tsdown](https://tsdown.dev/) (ESM + CJS + types). Run `pnpm build` from the package directory or `pnpm --filter @genetik/schema build` from the repo root.
