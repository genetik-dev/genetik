---
sidebar_position: 1
---

# @genetik/schema

The schema package is the foundation of the Genetik ecosystem. It uses its own config API (not raw JSON Schema) and returns a schema with getters plus a **contentSchema** (JSON Schema for the content document). Other packages (@genetik/content, @genetik/renderer, @genetik/builder, etc.) depend on it.

## Concepts

- **Config API**: `createSchema({ blocks, plugins, version, options, pageContextSchema })` — distinct from JSON Schema; plugins can register blocks, register page context properties, and add options.
- **Block input**: When registering a block you supply **id** (block type id), **configSchema** (JSON Schema for that block's config), and optional **slots** (default `[]`) with **name** and **multiple**. The **addable** property is defined by the editor plugin: set **addable: false** so the block cannot be added from the palette or "+ Add block" (e.g. a root-only "page" block). Slots can optionally include **layout** (`"row"` | `"column"`) so the editor’s slot drop target matches the block’s layout (e.g. a row block’s children slot uses `layout: "row"` so columns render horizontally in the canvas). Slots can restrict allowed block types: **includeBlockNames** (only these types) or **excludeBlockNames** (exclude these); only one should be set. You can set **default** (or **defaultValue**) on config properties; when a block is added in the editor, `@genetik/editor`'s `getDefaultConfig` uses those values for the new block's config. You can set **editorInput** on a property (`"text"` | `"number"` | `"textarea"` | `"checkbox"`) so the editor side panel renders a matching form field instead of raw JSON; if omitted, the editor infers from the property's **type** (string → text, number → number, boolean → checkbox). Optional **availableContexts**: array of context keys (from the page context schema) this block can listen to in context overrides; the config panel uses this to show a dropdown of allowed context keys.
- **Page context schema**: Optional **pageContextSchema** in config defines the shape of page context (properties with **type**, **default**, and optional **editorInput**). Plugins can add or override properties via **registerPageContextProperty(key, property)**. The resolved schema is on the schema instance as **pageContextSchema**; the editor uses it together with each block's **availableContexts** for the context-overrides dropdown.
- **Global reference mode**: **slotReferenceMode** is a schema-level option (`"id"` | `"inline"` | `"both"`). It applies to all slots. Default is `"id"`.
- **Plugins**: Build-time only. A plugin receives a context and can `registerBlock(block)`, **registerPageContextProperty(key, property)**, and read/mutate `options`.
- **Return value**: The schema instance has `blockTypes`, `meta`, **contentSchema** (JSON Schema for content), **options**, **version**, optional **pageContextSchema**, and getters: `getBlockType(id)`, `getBlockTypeNames()`, `hasBlockType(id)`.

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
  blocks: [
    {
      id: "text",
      configSchema: {
        type: "object",
        properties: { content: { type: "string" } },
        required: ["content"],
      },
      slots: [],
    },
    {
      id: "card",
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
  blocks: [textBlock],
  plugins: [
    (ctx) => {
      ctx.registerBlock({ id: "card", configSchema: {}, slots: [{ name: "children", multiple: true }] });
      ctx.options.myOption = "value";
    },
  ],
  version: "1.0.0",
});
```

**Plugin type extension**: When a plugin is typed with a block extension (e.g. `SchemaPlugin<EditorBlockInput>` from `@genetik/editor`), `createSchema` infers the type of `blocks` as the **intersection** of all plugins’ block types. You don’t need to import `EditorBlockInput` (or other plugin types) explicitly: use **`registerPlugins(pluginTuple)`** to get `plugins` and `defineBlock` so each block is type-checked against that intersection.

```ts
import { createSchema, registerPlugins } from "@genetik/schema";
import { editorSchemaPlugin } from "@genetik/editor";

const { plugins, defineBlock } = registerPlugins([editorSchemaPlugin] as const);

const textBlock = defineBlock({
  id: "text",
  configSchema: {
    type: "object",
    properties: {
      content: { type: "string", default: "...", editorInput: "textarea" },
    },
  },
  slots: [],
});

const schema = createSchema({
  blocks: [textBlock],
  plugins: plugins,
});
```

### Page context schema and availableContexts

Define a page context schema so the editor can offer context keys in the block config panel (context overrides). Use **contextPlugin(contextSchema)** and pass it into **registerPlugins**:

```ts
import { createSchema, registerPlugins, contextPlugin } from "@genetik/schema";
import { editorSchemaPlugin } from "@genetik/editor";

const contextSchema = {
  type: "object" as const,
  properties: {
    theme: { type: "string" as const, default: "light", editorInput: "text" as const },
    role: { type: "string" as const, default: "viewer", editorInput: "text" as const },
  },
};

const { plugins, defineBlock } = registerPlugins([
  editorSchemaPlugin,
  contextPlugin(contextSchema),
] as const);

createSchema({
  blocks: [textBlock, cardBlock],
  plugins,
});
```

You can also pass **pageContextSchema** in createSchema config, or in a custom plugin call **registerPageContextProperty(key, property)** for each key.

Blocks that can use context overrides declare **availableContexts** (keys from the page context schema):

```ts
defineBlock({
  id: "text",
  configSchema: { ... },
  slots: [],
  availableContexts: ["theme", "role"],
});
```

The config panel then shows only those keys in the context-override dropdown for that block.

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
| `registerPlugins(pluginTuple)` | Returns `{ plugins, defineBlock }`. Use `plugins` in `createSchema` and `defineBlock(block)` to type-check blocks against the intersection of the plugins’ block types (e.g. `editorInput` from the editor plugin). |
| `contextPlugin(contextSchema)` | Returns a schema plugin that registers the page context schema. Use in registerPlugins: `registerPlugins([editorSchemaPlugin, contextPlugin(contextSchema)] as const)`. |
| `createSchema(config)` | Create a schema. Config: `blocks`, `plugins`, `version`, `options`, optional `pageContextSchema`. Returns schema instance with getters, `contentSchema`, and optional `pageContextSchema`. |
| `getBlockType(schema, id)` | Get a block type by id. |
| `hasBlockType(schema, id)` | Check if a block type exists. |
| `getBlockTypeNames(schema)` | List all registered block type ids. |
| `validateConfig(schema, blockTypeId, config)` | Validate config against the block type's JSON Schema. |
| `validateConfigAgainstDefinition(blockType, config)` | Validate config when you already have the block type definition. |

Types: `BlockInput`, `BlockInputFromPlugins`, `BlockTypeDefinition`, `SlotInput`, `SlotDefinition`, `SlotLayoutHint`, `SlotReferenceMode`, `SchemaConfig`, `SchemaOptions`, `SchemaPlugin`, `SchemaPluginContext`, `SchemaInstance`, `GenetikSchema`, `SchemaMeta`, `JsonSchema`, `PageContextProperty`, `PageContextSchema`, `ValidationResult`.

## Package location and build

Source: `packages/schema` in the monorepo. The package is built with [tsdown](https://tsdown.dev/) (ESM + CJS + types). Run `pnpm build` from the package directory or `pnpm --filter @genetik/schema build` from the repo root.
