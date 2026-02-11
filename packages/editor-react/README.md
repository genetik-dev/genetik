# @genetik/editor-react

React UI for the Genetik content editor: drag blocks from a palette, drop into slots, click to add block via popover, remove and reorder. Uses **@atlaskit/pragmatic-drag-and-drop** and **@genetik/editor** for mutations.

## Usage

```tsx
import {
  EditorProvider,
  EditorDndProvider,
  BlockPalette,
  EditorCanvas,
} from "@genetik/editor-react";

<EditorProvider schema={schema} content={content} onChange={setContent}>
  <EditorDndProvider>
    <div style={{ display: "flex" }}>
      <aside>
        <BlockPalette />
      </aside>
      <main>
        <EditorCanvas />
      </main>
    </div>
  </EditorDndProvider>
</EditorProvider>
```

- **EditorProvider**: pass `schema`, `content`, `onChange(content)`.
- **EditorDndProvider**: wraps DnD context; required for drag-from-palette and (future) reorder.
- **BlockPalette**: list of block types (draggable).
- **EditorCanvas**: tree of slots (drop targets) and blocks (with remove); click "+ Add block" to open **SlotPopover** and pick a block type. Click the edit icon on a block to open the **config side panel**: if the block's `configSchema` defines **editorInput** on properties (`"text"` | `"number"` | `"textarea"` | `"checkbox"`), the panel shows form fields; otherwise it infers from JSON Schema **type**. A "Raw JSON" tab is available when the schema has properties.

## Exports

- `EditorProvider`, `EditorContext`, `useEditor`
- `EditorDndProvider`
- `BlockPalette`, `EditorCanvas`, `SlotDropTarget`, `SlotPopover`
