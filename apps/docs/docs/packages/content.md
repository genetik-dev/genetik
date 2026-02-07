---
sidebar_position: 2
---

# @genetik/content

The content package provides the **flat content model**, **validation** of content JSON against a schema, and **normalization** (inline → flat + id generation). It depends on @genetik/schema for block types and config validation.

## Concepts

- **Canonical form**: Content is stored and rendered as an **entry id** plus a **flat node map** (`nodeId → node`). Slots hold **id references** (a single id or an array of ids), not nested nodes.
- **ContentNode**: Each node has `id`, `block`, `config`, and slot names (from the block type) whose values are `string` or `string[]`.
- **Validation**: `validateContent(schema, content)` checks structure, block types, config (via schema), slot shapes, and link integrity (no dangling ids).
- **Normalization**: When the schema allows inline (slot `referenceMode` "inline" or "both"), slot values may be inline node(s). `normalizeContent(schema, input)` flattens them, assigns ids (via nanoid or a custom generator), and returns canonical content.

## Installation

```bash
pnpm add @genetik/content
```

## Types

```ts
import type { GenetikContent, ContentNode, SlotValue } from "@genetik/content";

// Content: entry point + flat map
const content: GenetikContent = {
  entryId: "root",
  nodes: {
    root: {
      id: "root",
      block: "text",
      config: { content: "Hello" },
    },
  },
};

// Slot values in canonical form: id or array of ids
const slotValue: SlotValue = "child-id";
const slotValues: SlotValue = ["id-1", "id-2"];
```

## Validation

```ts
import { validateContent } from "@genetik/content";
import { createSchema, registerBlockType } from "@genetik/schema";

const schema = createSchema();
registerBlockType(schema, {
  name: "text",
  configSchema: {
    type: "object",
    properties: { content: { type: "string" } },
    required: ["content"],
  },
  slots: [],
});

const result = validateContent(schema, {
  entryId: "root",
  nodes: {
    root: { id: "root", block: "text", config: { content: "Hi" } },
  },
});

if (result.valid) {
  // content is valid
} else {
  console.error(result.errors);
  // e.g. { path: "nodes.x.config", message: "..." }
}
```

Validation ensures:

- `entryId` is present and exists in `nodes`
- Every node has `id`, `block`, `config`; `block` is a known type; `config` passes the block's JSON Schema
- Slot values are `string` (single id) or `string[]` (list) according to the slot definition
- No extra keys on a node that are not slots of its block type
- Every id referenced in any slot exists in `nodes` (link integrity)

## Normalization

When a slot has `referenceMode` "inline" or "both", you can pass content with inline nodes in that slot. Normalization flattens them and assigns ids.

```ts
import { normalizeContent, validateContent } from "@genetik/content";
import { createSchema, registerBlockType } from "@genetik/schema";

const schema = createSchema();
registerBlockType(schema, {
  name: "text",
  configSchema: { type: "object", properties: { content: { type: "string" } }, required: ["content"] },
  slots: [],
});
registerBlockType(schema, {
  name: "card",
  configSchema: { type: "object", properties: { title: { type: "string" } } },
  slots: [{ name: "children", multiple: true, referenceMode: "both" }],
});

const input = {
  entryId: "root",
  nodes: {
    root: {
      id: "root",
      block: "card",
      config: { title: "Card" },
      children: [
        { block: "text", config: { content: "Inline child" } },
      ],
    },
  },
};

const canonical = normalizeContent(schema, input);
// canonical.nodes now has root + a new node for the inline text (with generated id)
const result = validateContent(schema, canonical);
// result.valid === true
```

Optional custom id generator:

```ts
const canonical = normalizeContent(schema, input, {
  generateId: () => `my-id-${Math.random().toString(36).slice(2)}`,
});
```

## API summary

| Export | Description |
|--------|-------------|
| `normalizeContent(schema, input, options?)` | Flattens inline nodes to canonical form; assigns ids (nanoid or custom). |
| `validateContent(schema, content)` | Validates content against a schema. Returns `{ valid, errors }`. |
| `GenetikContent` | Type: `{ entryId: string; nodes: Record<string, ContentNode> }`. |
| `GenetikContentInput` | Type: input content (slots may contain inline nodes where schema allows). |
| `ContentNode` | Type: node with `id`, `block`, `config`, and slot keys. |
| `ContentNodeInput` | Type: input node (same as ContentNode; slot values may be inline). |
| `SlotValue` | Type: `string \| string[]`. |
| `InlineNode`, `InlineSlotValue` | Types for inline slot values. |
| `NormalizeOptions` | Type: `{ generateId?: () => string }`. |
| `ContentValidationError` | Type: `{ path: string; message: string }`. |
| `ContentValidationResult` | Type: `{ valid: boolean; errors: ContentValidationError[] }`. |

## Package location and build

Source: `packages/content` in the monorepo. The package is built with [tsdown](https://tsdown.dev/) (ESM + CJS + types). Run `pnpm build` from the package directory or `pnpm --filter @genetik/content build` from the repo root.
