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

- **Component map**: `Record<string, ComponentType<BlockProps>>` — maps each block type name to a React component that receives `config` and `slots`.
- **BlockProps**: Every block component receives `config: Record<string, unknown>` and `slots: Record<string, ReactNode[]>` (each slot is an array of already-rendered children).
- **Unknown blocks**: If a block type has no entry in the component map, that node is rendered as `null`.

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
// Use in your tree: <>{node}</> or return node from a parent component. Invalid JSON returns null.
```

## API summary

| Export | Description |
|--------|-------------|
| `renderContent(content, schema, componentMap)` | Resolve and render the content root. `content` may be a `GenetikContent` object or a JSON string (parsing is done by resolve in @genetik/renderer). Returns `ReactNode` or null (invalid JSON, missing entry, or unmapped block). |
| `renderNode(node, componentMap)` | Render a single resolved node with the component map. |
| `BlockProps` | Type: `{ config: Record<string, unknown>; slots: Record<string, ReactNode[]> }`. |
| `ComponentMap` | Type: `Record<string, ComponentType<BlockProps>>`. |

## Package location and build

Source: `packages/renderer-react` in the monorepo. Built with [tsdown](https://tsdown.dev/). Run `pnpm --filter @genetik/renderer-react build` from the repo root.
