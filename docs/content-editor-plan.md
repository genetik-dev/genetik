# Content Editor — Plan (@genetik/editor + @genetik/editor-react)

Plan for a **content editor** that lets users add, remove, and reorder blocks in Genetik content via drag-and-drop and a slot popup. Split into a **core editor package** (framework-agnostic utilities) and **editor-react** (React UI using @dnd-kit).

---

## 1. Goals

- **Drag blocks from a side panel** and drop them into a **slot** on the canvas.
- **Click a slot** on the canvas to open a **popup** and choose a block to add.
- **Drag and drop blocks on the canvas** to reorder them within a slot.
- **Core vs UI**: `@genetik/editor` holds state and mutation logic; `@genetik/editor-react` provides the React components and uses the core.
- **Demo**: Integrate the editor into the **docs site Playground** page so we can edit content with the editor and see it rendered.

---

## 2. Package Split

| Package | Role |
|--------|------|
| **@genetik/editor** | Core utilities: content state, applying patches, generating node ids, computing “allowed blocks” for a slot from the schema, selection/highlight state. No React, no DOM. Consumed by editor-react and (later) other editor UIs. |
| **@genetik/editor-react** | React components + context: provider (schema, initial content, onChange), side panel (block palette), canvas (slots + blocks), slot popup (pick block to add), drag-and-drop via **@dnd-kit**. Uses @genetik/editor for all mutations and @genetik/patches for patch application. |

---

## 3. @genetik/editor (core)

**Dependencies**: `@genetik/content`, `@genetik/schema`, `@genetik/patches`.

**Responsibilities**

- **Content state**: Hold current content (or expose a minimal “view” over it). No framework state — the **owner** (e.g. React app) holds content and passes it in; the core produces **patches** and the owner applies them (e.g. via `applyPatch` from @genetik/patches) and updates state.
- **Commands / operations**: Pure functions that return **patch ops** (or a single patch) for:
  - **Add block to slot**: given parent node id, slot name, block type, optional position index → `AddNodeOp` (with generated id and default config) + `ReorderSlotOp` to insert into slot.
  - **Remove block**: → `RemoveNodeOp`.
  - **Reorder within slot**: → `ReorderSlotOp`.
- **Id generation**: Generate unique node ids (e.g. nanoid or `node-${Date.now()}-${random}`) so the editor can create new nodes without id collisions.
- **Schema queries**: Given schema and (optionally) a block type + slot name, return **allowed block types** for that slot (from schema: which block types exist; we can later restrict by slot if the schema supports it, or allow all blocks in every slot for v1).
- **Validation**: Optionally use @genetik/content (and schema) to validate content after each change before calling onChange (or leave validation to the host).

**API (conceptual)**

- `createAddToSlotPatch(parentId, slotName, blockType, options?: { position?: number })` → `Patch`.
- `createRemovePatch(nodeId)` → `Patch`.
- `createReorderPatch(parentId, slotName, newOrder: string[])` → `Patch`.
- `generateNodeId()` → string.
- `getAllowedBlockTypes(schema)` → string[] (or more refined: per-slot if schema supports it).
- `getDefaultConfig(schema, blockType)` → `Record<string, unknown>` (default config for a new block of that type; from schema or empty object).

**No React, no DOM** — only types and pure functions. The **host** (editor-react) holds content in state, calls these helpers to get patches, applies them with `applyPatch`, and passes the new content to the provider’s `onChange`.

---

## 4. @genetik/editor-react (React UI)

**Dependencies**: `@genetik/editor`, `@genetik/content`, `@genetik/schema`, `@genetik/patches`, `@genetik/renderer-react` (for preview), `@dnd-kit/core` + `@dnd-kit/sortable` (and related), `@genetik/ui-react` (optional, for UI chrome), React.

**Context provider**

- **Props**: `schema`, `content` (initial), `onChange(content)`, optionally `componentMap` (for preview) and `blockTypes` (metadata: label, icon per block type for the palette).
- **Context value**: Same schema + current content + a **dispatch** (or imperative API) so child components can request “add block here”, “remove this block”, “reorder to this index”. Dispatch internally uses @genetik/editor to build patches and @genetik/patches to apply them, then calls `onChange(newContent)`.

**Components (exported)**

- **EditorProvider**: Wraps the editor tree; accepts schema, content, onChange. Provides context (content, schema, dispatch, allowed block types, etc.).
- **EditorSidebar** (or **BlockPalette**): Lists draggable block types (from schema). User drags a block type; drop target is a slot on the canvas.
- **EditorCanvas**: Renders the content tree as a series of slots and blocks. Each slot is a drop target (from palette) and a clickable area (opens “add block” popup). Blocks inside slots are draggable for reorder (same slot only, or cross-slot if we support it later).
- **SlotPopover** (or **AddBlockPopover**): Shown when user clicks a slot (or an “add block” affordance). Lists allowed block types; on select, dispatches “add block to this slot” and closes.
- Optional: **BlockWrapper**: Wraps each block on the canvas with a “selected” state, remove button, and drag handle (for reorder). Can be one component that wraps the block’s preview (renderer output) and adds editor chrome.

**Drag and drop (@dnd-kit)**

- **Two DnD “realms”** (or one unified with different drag types):
  1. **Palette → Canvas**: Drag **block type** (e.g. `{ type: "blockType", blockType: "card" }`) from the sidebar; drop on a **slot** (drop target). On drop: resolve parent node id + slot name from the drop target, then add node (with default config) and reorder slot.
  2. **Canvas reorder**: Drag a **block instance** (node id) within a slot; drop between two siblings or at start/end. On drop: build new order array and apply `ReorderSlotOp`.
- Use **@dnd-kit** (e.g. `DndContext`, `SortableContext` for reorder, custom drag overlay if desired). Palette items and canvas blocks each have a `useDraggable` (or similar); slots and sortable lists have `useDroppable` / `useSortable`.
- **Data transfer**: Use @dnd-kit’s `data` (e.g. `active.data.current`) to pass `{ type: "blockType", blockType: "card" }` vs `{ type: "node", nodeId: "..." }` so the drop handler can tell add-vs-reorder.

**Rendering the canvas**

- Canvas can use **@genetik/renderer-react** to render the current content for preview, but each block/slot is wrapped with editor UI (drop zones, selection, drag handles). So we either:
  - **Option A**: Use the renderer to produce the tree, then “wrap” or “inject” editor UI at each node/slot (e.g. via a custom component map that wraps blocks in BlockWrapper and slots in SlotDropTarget).
  - **Option B**: Build a separate “editor tree” walk that mirrors the content and renders slots and blocks with the renderer inside each block, plus drop targets and drag handles.
- Option A is simpler if the renderer (or a thin wrapper) can accept a “slot component” and “block wrapper” so we don’t fork the tree. Option B gives full control. Start with **Option A** if the renderer’s component map can receive wrapper components; otherwise Option B (walk content, render block + slot chrome manually).

---

## 5. Data Flow

1. **Host** (e.g. docs Playground) holds `content` in state, passes `schema`, `content`, `onChange(setContent)` to `EditorProvider`.
2. **EditorProvider** stores content in context (or passes it through); provides a **dispatch** that, when called with an action (e.g. `addBlock({ parentId, slotName, blockType })`), uses @genetik/editor to create a patch, applies it with `applyPatch(content, patch)`, then calls `onChange(newContent)`.
3. **Sidebar** and **Canvas** read content/schema from context; user actions (drag-drop, popup choice) call dispatch.
4. **Host**’s `onChange` updates state and may persist or re-render; the editor re-renders with new content from context.

---

## 6. Docs Playground Integration

- **Playground page**: Instead of (or in addition to) the current “raw JSON textarea + preview”, add a **tab or mode** that renders `EditorProvider` + `EditorSidebar` + `EditorCanvas` (and optional preview pane using the same renderer).
- **Props**: Use the same schema and block types as the current Playground (text, card, etc.). Initial content can be the same sample or empty. `onChange` updates the Playground’s content state so the preview (and editor canvas) stay in sync.
- **Styling**: Use @genetik/ui-react for sidebar, popover, buttons if desired; or minimal CSS for the demo.

---

## 7. Implementation Order

1. **@genetik/editor**
   - Add package `packages/editor` (package.json, tsconfig, tsdown, deps: content, schema, patches).
   - Implement: `generateNodeId`, `getAllowedBlockTypes(schema)`, `getDefaultConfig(schema, blockType)` (or minimal default).
   - Implement: `createAddToSlotPatch`, `createRemovePatch`, `createReorderPatch` (return Patch; host applies with `applyPatch`).
   - Export from `index.ts`; add tests.

2. **@genetik/editor-react**
   - Add package `packages/editor-react` (deps: editor, content, schema, patches, renderer-react, @dnd-kit/*, react).
   - **EditorContext**: types for context value (content, schema, dispatch). **EditorProvider**: accepts schema, content, onChange; implements dispatch (create patch → applyPatch → onChange); provides context.
   - **BlockPalette**: list of block types (from schema), each draggable with @dnd-kit; drag data = `{ type: "blockType", blockType }`.
   - **Slot drop target**: useDroppable; on drop of blockType, dispatch addBlock(parentId, slotName, blockType).
   - **Canvas**: render content (e.g. by walking nodes and rendering blocks + slots). Each slot = drop target + click to open popup. Each block = optional drag handle for reorder (useSortable), wrapper with selection/remove.
   - **SlotPopover**: popover (from ui-react or minimal) listing block types; on select, dispatch addBlock and close.
   - Wire **reorder** within a slot: SortableContext on the slot’s children; on sort end, dispatch reorder(parentId, slotName, newOrder).
   - Export: EditorProvider, EditorSidebar (or BlockPalette), EditorCanvas, SlotPopover (and any subcomponents). README with usage.

3. **Docs Playground**
   - Add editor to the Playground page: EditorProvider(schema, content, onChange) wrapping EditorSidebar + EditorCanvas (and existing or new preview). Sync content state so both editor and preview show the same data.
   - Optional: toggle “Edit JSON” vs “Visual editor” so we keep the raw JSON view and add the visual editor as a second mode.

4. **Polish**
   - Block metadata (label, icon) for palette: from a registry or a prop `blockTypes: Record<string, { label, icon? }>`.
   - Keyboard (e.g. Delete to remove selected block), accessibility (focus, aria).
   - Tests for editor core and (optionally) editor-react.

---

## 8. Summary Checklist

- [ ] **@genetik/editor**: Package scaffold; `generateNodeId`, `getAllowedBlockTypes`, `getDefaultConfig`; `createAddToSlotPatch`, `createRemovePatch`, `createReorderPatch`; tests.
- [ ] **@genetik/editor-react**: Package scaffold; EditorProvider (schema, content, onChange) + context; BlockPalette (draggable block types with @dnd-kit); Canvas with slot drop targets and block wrappers; SlotPopover (add block on slot click); reorder within slot with @dnd-kit sortable; export components.
- [ ] **Docs**: Playground page uses EditorProvider + sidebar + canvas; content state synced with preview; optional JSON vs visual toggle.
- [ ] **DnD**: @dnd-kit for palette → slot (add) and block → position in slot (reorder).

This gives a clear path to a working content editor with two packages (core + React), @dnd-kit, and a demo in the docs site.
