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

Both modes share the same content state: switching between JSON and visual editor does not reset or desync content; the preview always reflects the current document.

## @genetik/editor (core)

**Dependencies**: `@genetik/content`, `@genetik/patches`, `@genetik/schema`, `nanoid`.

**API**

- `generateNodeId()` — Returns a new unique node id (nanoid).
- `getAllowedBlockTypes(schema)` — All block type ids from the schema.
- `getAddableBlockTypes(schema)` — Block types that can be added from the palette or "+ Add block" (excludes blocks with `addable: false` from the editor plugin).
- `getSlotAllowedBlockTypes(schema, slotDef)` — Block type ids allowed in a slot (respects slot `includeBlockNames` / `excludeBlockNames` and schema addability).
- `getDefaultConfig(schema, blockType)` — Default config for a new block (uses each property's `default` or `defaultValue` from the block's configSchema).
- `createAddToSlotPatch(content, schema, parentId, slotName, blockType, options?)` — Patch to add a new block to a slot.
- `createRemovePatch(content, nodeId)` — Patch to remove a node.
- `createReorderPatch(content, parentId, slotName, order)` — Patch to reorder a slot.
- `createMoveToSlotPatch(content, nodeId, fromParentId, fromSlotName, toParentId, toSlotName, toIndex)` — Patch to move a node from one slot to another (or to another index in the same slot).
- `createUpdateConfigPatch(content, nodeId, config)` — Patch to update a node's config.

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
- **SlotDropTarget**, **SlotPopover** — Exported for custom layouts; the canvas uses them internally. SlotDropTarget accepts an optional **layout** (`"row"` | `"column"`) from the schema’s slot definition so the slot’s children are laid out horizontally or vertically in the canvas, matching how the block will render (e.g. a row block’s children slot with `layout: "row"` shows columns side-by-side). When the slot has `layout: "row"`, the **drop placeholder** (where a dragged block would land) is shown to the **left or right** of blocks based on pointer position; otherwise it appears above or below. When a slot has **includeBlockNames** or **excludeBlockNames**, only allowed block types can be dropped; disallowed types do not highlight the slot or show the placeholder, and "+ Add block" lists only allowed types.

Drag a block type from the palette onto a slot to add a block; use the slot’s “add” affordance to open **SlotPopover** and pick a block type. Drag a block on the canvas to reorder it within the same slot or move it to another slot (e.g. in or out of nested levels).
