---
sidebar_position: 5
---

# @genetik/renderer-react

React binding for **@genetik/renderer**: takes flat content (object or JSON string), a schema, and a **component map** (block type → React component) and renders the content tree.

## Installation

```bash
pnpm add @genetik/renderer-react
```

Requires `react` (>=18.0.0) as a peer dependency.

## Concepts

- **Component map**: `Record<string, ComponentType<BlockProps>>` — maps each block type id to a React component that receives `config` and `slots`.
- **BlockProps**: Every block component receives `config` and `slots`. When page runtime options are passed to `renderContent`, blocks also receive `context`, `updateContext`, and `emit` (see **Page runtime** below).
- **Unknown blocks**: If a block type has no entry in the component map, that node is rendered as `null`.
- **Page runtime**: Optional fourth argument to `renderContent`: `{ context, onContextUpdate, onEvent }`. When provided, the tree is wrapped so each block gets effective config and visibility from **context overrides** (`config.contextOverrides`) and receives `context`, `updateContext`, and `emit` in props.

## Usage

```tsx
import { renderContent } from "@genetik/renderer-react";
import type { BlockProps } from "@genetik/renderer-react";
import { createSchema } from "@genetik/schema";
import type { GenetikContent } from "@genetik/content";

const schema = createSchema({ blocks: [textBlock, cardBlock] });

function TextBlock({ config }: BlockProps) {
  return <span>{(config as { content?: string }).content ?? ""}</span>;
}

function CardBlock({ config, slots }: BlockProps) {
  return (
    <div title={(config as { title?: string }).title ?? ""}>
      {slots.children ?? []}
    </div>
  );
}

const componentMap = { text: TextBlock, card: CardBlock };

// Content as object or JSON string (parsed automatically)
const content = { entryId: "root", nodes: { root: { id: "root", block: "text", config: { content: "Hello" } } } };
const node = renderContent(content, schema, componentMap);

const rawJson = '{"entryId":"root","nodes":{"root":{"id":"root","block":"text","config":{"content":"Hi"}}}}';
const nodeFromString = renderContent(rawJson, schema, componentMap);

// With page context (blocks receive context, updateContext, emit; context overrides applied)
const nodeWithContext = renderContent(content, schema, componentMap, {
  context: { theme: "dark", role: "admin" },
  onContextUpdate: (path, value) => { /* update host state */ },
  onEvent: (name, payload) => { /* e.g. forms:submit */ },
});
// Use in your tree: <>{node}</> or return node from a parent component. Invalid JSON returns null.
```

## API summary

| Export | Description |
|--------|-------------|
| `renderContent(content, schema, componentMap, options?)` | Resolve and render the content root. Optional `options`: `{ context, onContextUpdate, onEvent }` to provide page runtime; when set, blocks receive context/updateContext/emit and context overrides are applied. Returns `ReactNode` or null. |
| `renderNode(node, componentMap, useContextWrapper)` | Render a single resolved node. `useContextWrapper`: when true, wraps the block for context and overrides. |
| `BlockProps` | Type: `config`, `slots`; when runtime is provided also `context?`, `updateContext?`, `emit?`. |
| `ComponentMap` | Type: `Record<string, ComponentType<BlockProps>>`. |

## Package location and build

Source: `packages/renderer-react` in the monorepo. Built with [tsdown](https://tsdown.dev/). Run `pnpm --filter @genetik/renderer-react build` from the repo root.
