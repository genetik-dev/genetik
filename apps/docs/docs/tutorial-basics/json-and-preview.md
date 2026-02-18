---
sidebar_position: 5
---

# JSON mode and preview

The playground offers two ways to edit content (JSON and visual) and a live preview that uses the same schema and component map.

## JSON mode

Store the raw JSON string in state and parse it with `parseContentJson` from `@genetik/content`. When parsing succeeds, sync the result into the content state used by the editor and preview:

```tsx
const [raw, setRaw] = useState(() => JSON.stringify(INITIAL_CONTENT, null, 2));
const parseResult = useMemo(() => parseContentJson(raw), [raw]);

const handleJsonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const next = e.target.value;
  setRaw(next);
  const result = parseContentJson(next);
  if (result.ok) setContent(result.content);
}, []);
```

When switching from visual to JSON, serialize the current content:

```tsx
const switchToJson = useCallback(() => {
  setRaw(JSON.stringify(content, null, 2));
  setMode("json");
}, [content]);
```

Show a textarea for `raw` and, when `!parseResult.ok`, display `parseResult.error` so the user can fix invalid JSON.

## Preview

Render the current content with `renderContent` from `@genetik/renderer-react`, passing the same schema and component map. Provide context and `onContextUpdate` so blocks like the button can read and update page context:

```tsx
const preview = useMemo(() => {
  return renderContent(content, playgroundSchema, componentMap, {
    context: pageContext,
    onContextUpdate: handleContextUpdate,
  });
}, [content, pageContext, handleContextUpdate]);
```

Render `preview` in a dedicated area (e.g. a "Preview" section). Use the same `[data-twp]` (or equivalent) wrapper if your styles are scoped so the preview matches the editor's look.

## Modes

- **Edit JSON** — textarea for `raw`; on valid parse, update `content`.
- **Visual editor** — `EditorProvider` + `BlockPalette` + `EditorCanvas`; `onChange` updates `content`.

Both modes drive the same `content` state, so switching between them and the preview stays in sync. Finish with [Congratulations](./congratulations).
