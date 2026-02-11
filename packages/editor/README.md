# @genetik/editor

Core utilities for the Genetik content editor: node id generation, schema helpers, and patch creation. Framework-agnostic; consumed by **@genetik/editor-react** (or other editor UIs).

## API

- **`generateNodeId()`** — returns a unique id for new nodes (nanoid).
- **`getAllowedBlockTypes(schema)`** — returns block type names from the schema.
- **`getDefaultConfig(schema, blockType)`** — returns default config for a new block from the block’s `configSchema`: each property’s `default` (JSON Schema) or `defaultValue` is used when adding a block.
- **`createAddToSlotPatch(content, schema, parentId, slotName, blockType, options?)`** — patch to add a node and insert into a slot. Options: `{ position?: number }`.
- **`createRemovePatch(content, nodeId)`** — patch to remove a node.
- **`createReorderPatch(content, parentId, slotName, order)`** — patch to set a slot’s order.

The host applies patches with `applyPatch` from `@genetik/patches`.
