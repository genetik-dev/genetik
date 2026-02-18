---
sidebar_position: 4
---

# Wire up the editor

The visual editor uses `EditorProvider`, `EditorDndProvider`, `BlockPalette`, and `EditorCanvas` from `@genetik/editor-react`. The host holds content state and passes it down; the editor mutates content via `onChange`.

## State and handlers

Keep content in React state. When the user edits in the visual editor, update that state:

```tsx
const [content, setContent] = useState<GenetikContent>(INITIAL_CONTENT);

const handleVisualContentChange = useCallback((next: GenetikContent) => {
  setContent(next);
}, []);
```

If you use page context (e.g. for the button block), hold it and an updater too:

```tsx
const [pageContext, setPageContext] = useState<PageContext>(() => ({ customContextBoolean: true }));

const handleContextUpdate = useCallback((path: string, value: unknown) => {
  setPageContext((prev) => {
    const next = JSON.parse(JSON.stringify(prev)) as PageContext;
    setContextValue(next, path, value);
    return next;
  });
}, []);
```

## EditorProvider

Wrap the editor UI in `EditorProvider` with schema, content, `onChange`, `componentMap`, and optional `context` / `onContextUpdate`. Use a ref for `portalContainer` so dropdowns and the config panel portal into the same scoped container (e.g. a `[data-twp]` div) for correct styling:

```tsx
const twpRef = useRef<HTMLDivElement>(null);

<EditorProvider
  schema={playgroundSchema}
  content={content}
  onChange={handleVisualContentChange}
  componentMap={componentMap}
  context={pageContext}
  onContextUpdate={handleContextUpdate}
  portalContainer={twpRef}
>
  <EditorDndProvider>
    <div style={{ display: "flex", gap: 24 }}>
      <aside style={{ minWidth: 160 }}>
        <strong style={{ display: "block", marginBottom: 8 }}>Blocks</strong>
        <BlockPalette />
      </aside>
      <div style={{ flex: 1 }}>
        <strong style={{ display: "block", marginBottom: 8 }}>Canvas</strong>
        <EditorCanvas />
      </div>
    </div>
  </EditorDndProvider>
</EditorProvider>
```

- **BlockPalette** — lists draggable block types from the schema.
- **EditorCanvas** — renders the content tree; users can add blocks (via slot "+ Add block"), remove/reorder, and open the config side panel by clicking edit on a block.

Ensure the wrapper (e.g. the div with the ref) has `data-twp` so Tailwind and theme styles apply to portaled content. Import `@genetik/ui-react/dist/styles.css` (or the app's global CSS that includes it) so the editor chrome is styled.

Next: [JSON mode and preview](./json-and-preview) — raw JSON editing and live preview with `renderContent`.
