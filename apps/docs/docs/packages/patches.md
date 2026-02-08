---
sidebar_position: 3
---

# @genetik/patches

Structured mutations over content: add node, remove node, update config, reorder slot. Apply a patch to get new content without mutating the input. Used by revisions (drafts/published, history), undo/redo, and LLM edit-in-place.

## Installation

```bash
pnpm add @genetik/patches
```

## Concepts

- **Patch**: A single operation (`PatchOp`) or an array of operations applied in order.
- **Operations**: `addNode`, `removeNode`, `updateConfig`, `reorderSlot`.
- **Immutable**: `applyPatch(content, patch)` returns new content; the input is not modified. The result is not validated (e.g. use @genetik/content’s `validateContent` if needed).

## Usage

```ts
import { applyPatch } from "@genetik/patches";
import type { GenetikContent } from "@genetik/content";

const content: GenetikContent = {
  entryId: "root",
  nodes: {
    root: { id: "root", block: "card", config: { title: "Root" }, children: ["a", "b"] },
    a: { id: "a", block: "text", config: { content: "A" } },
    b: { id: "b", block: "text", config: { content: "B" } },
  },
};

// Add a node
const withC = applyPatch(content, {
  type: "addNode",
  id: "c",
  node: { id: "c", block: "text", config: { content: "C" } },
});

// Update config
const updated = applyPatch(content, {
  type: "updateConfig",
  id: "root",
  config: { title: "Updated" },
});

// Reorder a slot
const reordered = applyPatch(content, {
  type: "reorderSlot",
  id: "root",
  slotName: "children",
  order: ["b", "a"],
});

// Remove a node (also removes its id from any slot that references it)
const withoutA = applyPatch(content, { type: "removeNode", id: "a" });

// Multiple operations
const result = applyPatch(content, [
  { type: "addNode", id: "c", node: { id: "c", block: "text", config: { content: "C" } } },
  { type: "reorderSlot", id: "root", slotName: "children", order: ["a", "b", "c"] },
]);
```

## Operations

| Operation | Description |
|-----------|-------------|
| `addNode` | Add a node to the map. If the id already exists, the node is overwritten. |
| `removeNode` | Remove the node and remove its id from every slot that references it. |
| `updateConfig` | Replace a node’s `config`. No-op if the node does not exist. |
| `reorderSlot` | Set a node’s slot to an ordered list of ids. No-op if the node does not exist. |

## API summary

| Export | Description |
|--------|-------------|
| `applyPatch(content, patch)` | Apply one or more operations; returns new content. |
| `AddNodeOp`, `RemoveNodeOp`, `UpdateConfigOp`, `ReorderSlotOp` | Operation types. |
| `PatchOp`, `Patch` | Single op or array of ops. |
| `ContentNode`, `GenetikContent` | Re-exported from @genetik/content. |

## Package location and build

Source: `packages/patches` in the monorepo. Built with [tsdown](https://tsdown.dev/). Run `pnpm --filter @genetik/patches build` from the repo root.
