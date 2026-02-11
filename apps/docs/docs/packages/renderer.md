---
sidebar_position: 4
---

# @genetik/renderer

Framework-agnostic core that resolves content and schema into a **resolved tree** of nodes. It does not render UI; a binding (e.g. **@genetik/renderer-react**) maps the tree to framework components.

## Installation

```bash
pnpm add @genetik/renderer
```

## Concepts

- **Resolved tree**: Starting from the content entry node, each node is turned into a **ResolvedNode** with `block`, `config`, and `slots`. Each slot is an ordered array of child ResolvedNodes (resolved recursively).
- **No component map in core**: The core only does data resolution. A React (or other) binding takes the resolved tree plus a map of block type → component and produces UI.
- **Missing nodes**: If a slot references an id that is not in the content map, that child is skipped (no placeholder).
- **Content as object or string**: `resolve` accepts either a `GenetikContent` object or a JSON string (parsed with `parseContentJson` from @genetik/content). Invalid JSON returns null.

## Usage

```ts
import { resolve } from "@genetik/renderer";
import type { GenetikSchema } from "@genetik/schema";

const content = { entryId: "root", nodes: { root: { id: "root", block: "text", config: { content: "Hi" } } } };
const schema: GenetikSchema = createSchema({ blocks: [...] });

const root = resolve(content, schema);
// Or pass a JSON string:
const rootFromString = resolve(JSON.stringify(content), schema);

if (root) {
  // root.block, root.config, root.slots (e.g. root.slots.children)
  // Each slot is ResolvedNode[] in order.
}
```

## ResolvedNode

```ts
interface ResolvedNode {
  id: string;       // content node id (for React keys when rendering slot children)
  block: string;
  config: Record<string, unknown>;
  slots: Record<string, ResolvedNode[]>;
}
```

## API summary

| Export | Description |
|--------|-------------|
| `resolve(content, schema)` | Resolve content to the root ResolvedNode. `content` may be a `GenetikContent` object or a JSON string (parsed with parseContentJson). Returns null if content is invalid JSON, the entry node is missing, or resolution fails. |
| `ResolvedNode` | Type: `{ block, config, slots }`. |

## Package location and build

Source: `packages/renderer` in the monorepo. Built with [tsdown](https://tsdown.dev/). Run `pnpm --filter @genetik/renderer build` from the repo root.
