---
sidebar_position: 6
---

# Content editor (@genetik/editor + @genetik/editor-react)

The content editor lets you add, remove, and reorder blocks in Genetik content via a **block palette**, **canvas**, and **drag-and-drop**. It is split into:

- **@genetik/editor** — Framework-agnostic core: patch creation (add/remove/reorder), node id generation, schema helpers (allowed block types, default config).
- **@genetik/editor-react** — React UI: provider, block palette, editor canvas, slot drop targets, and a slot popover for adding blocks. Uses **@atlaskit/pragmatic-drag-and-drop** for drag-and-drop.

## Playground

The docs site **Playground** demonstrates both editing modes:

- **Edit JSON** — Edit content as raw JSON; the preview updates when the JSON is valid.
- **Visual editor** — Use the block palette and canvas to add/remove blocks and see the preview update. Drag block types from the palette onto slots, or use the slot popover to add blocks.

## @genetik/editor (core)

**Dependencies**: `@genetik/content`, `@genetik/patches`, `@genetik/schema`, `nanoid`.

**API**

- `generateNodeId()` — Returns a new unique node id (nanoid).
- `getAllowedBlockTypes(schema)` — Block types allowed by the schema.
- `getDefaultConfig(schema, blockType)` — Default config for a new block (currently `{}`).
- `createAddToSlotPatch(content, schema, parentId, slotName, blockType, options?)` — Patch to add a new block to a slot.
- `createRemovePatch(content, nodeId)` — Patch to remove a node.
- `createReorderPatch(content, parentId, slotName, order)` — Patch to reorder a slot.
- `createMoveToSlotPatch(content, nodeId, fromParentId, fromSlotName, toParentId, toSlotName, toIndex)` — Patch to move a node from one slot to another (or to another index in the same slot).

The host (e.g. editor-react) holds content in state, calls these to build patches, applies them with `applyPatch` from @genetik/patches, then updates state and calls `onChange(newContent)`.

## @genetik/editor-react (React UI)

**Dependencies**: `@genetik/editor`, `@genetik/content`, `@genetik/patches`, `@genetik/renderer-react`, `@genetik/schema`, `@atlaskit/pragmatic-drag-and-drop`. Peer: `react`, `react-dom`.

**Styling**: The package uses **Tailwind CSS v4** utility classes. The host app must compile Tailwind and include the editor-react source in its content so those classes are generated (e.g. in the docs app, Tailwind runs via PostCSS and scans `packages/editor-react/src`).

**Usage**

```tsx
import {
  EditorProvider,
  EditorDndProvider,
  BlockPalette,
  EditorCanvas,
} from "@genetik/editor-react";

<EditorProvider
  schema={schema}
  content={content}
  onChange={setContent}
  componentMap={componentMap}
>
  <EditorDndProvider>
    <aside>
      <BlockPalette />
    </aside>
    <main>
      <EditorCanvas />
    </main>
  </EditorDndProvider>
</EditorProvider>
```

- **EditorProvider** — Accepts `schema`, `content`, `onChange(content)`, and optional `componentMap`. Provides editor context (dispatch, schema, content).
- **EditorDndProvider** — Registers a global drop monitor. Handles palette → slot (add block), reordering blocks within a slot, and moving blocks between slots (e.g. nested items to another level).
- **BlockPalette** — Renders draggable block types from the schema.
- **EditorCanvas** — Renders the content tree: slots as drop targets and blocks with remove controls and nested slots.
- **SlotDropTarget**, **SlotPopover** — Exported for custom layouts; the canvas uses them internally.

Drag a block type from the palette onto a slot to add a block; use the slot’s “add” affordance to open **SlotPopover** and pick a block type. Drag a block on the canvas to reorder it within the same slot or move it to another slot (e.g. in or out of nested levels).
