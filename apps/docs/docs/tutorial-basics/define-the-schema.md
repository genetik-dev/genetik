---
sidebar_position: 2
---

# Define the schema

The playground schema defines every block type the editor and renderer understand: config shape, slots, and optional context.

## Create the schema module

Use `@genetik/schema` to create a schema with `createSchema` and `registerPlugins`. The docs playground uses `defineBlock` from `registerPlugins` and plugs in `editorSchemaPlugin` (from `@genetik/editor`) and a context plugin.

```ts
import { createSchema, registerPlugins, contextPlugin } from "@genetik/schema";
import { editorSchemaPlugin } from "@genetik/editor";

const contextSchema = {
  type: "object" as const,
  properties: {
    customContextBoolean: { type: "boolean" as const, default: false, editorInput: "checkbox" as const },
    theme: { type: "string" as const, default: "light", editorInput: "text" as const },
    role: { type: "string" as const, default: "viewer", editorInput: "text" as const },
  },
};

const { plugins, defineBlock } = registerPlugins([
  editorSchemaPlugin,
  contextPlugin(contextSchema),
] as const);
```

## Define block types

Each block is defined with `defineBlock`: `id`, `configSchema` (JSON Schema with optional `editorInput` per property), and `slots`. Slots can restrict which block types are allowed (`includeBlockNames` / `excludeBlockNames`) and use `layout: "row"` or `"column"` for the editor.

**Text block** — no slots, simple config:

```ts
const textBlock = defineBlock({
  id: "text",
  configSchema: {
    type: "object",
    properties: {
      content: { type: "string", default: "...", editorInput: "textarea" },
    },
  },
  slots: [],
  availableContexts: ["theme", "role", "customContextBoolean"],
});
```

**Row and column** — layout blocks with a single `children` slot:

```ts
const rowBlock = defineBlock({
  id: "row",
  configSchema: { type: "object", properties: { gap: { type: "string", default: "normal", editorInput: "text" } } },
  slots: [{ name: "children", multiple: true, layout: "row", includeBlockNames: ["column"] }],
});

const columnBlock = defineBlock({
  id: "column",
  configSchema: { type: "object" },
  slots: [{ name: "children", multiple: true, layout: "column", excludeBlockNames: ["column"] }],
});
```

**Page (root)** — root-only, not addable from the palette:

```ts
const pageBlock = defineBlock({
  id: "page",
  configSchema: { type: "object" },
  slots: [{ name: "children", multiple: true, includeBlockNames: ["row"] }],
  addable: false,
});
```

## Export the schema

```ts
export const playgroundSchema = createSchema({
  blocks: [textBlock, cardBlock, rowBlock, columnBlock, imageBlock, buttonBlock, pageBlock],
  plugins,
});
```

Use this schema for both the editor and for `renderContent` when rendering preview (and at runtime). Next: [Block components](./block-components) that render each block type.
