---
sidebar_position: 3
---

# Block components

Block components are React components that receive `BlockProps` from the renderer and render a single block. The same components are used for **preview** and inside the **editor canvas** (the editor wraps them with chrome like edit/remove).

## BlockProps

From `@genetik/renderer-react`, each component receives:

- `config` — the block's config object (typed per block)
- `slots` — rendered slot content, e.g. `slots.children` (React nodes)
- Optional slot/block metadata as needed

## Example components

**Text:** render `config.content`.

```tsx
import type { BlockProps } from "@genetik/renderer-react";

export function TextBlock({ config }: BlockProps) {
  const content = (config as { content?: string }).content ?? "";
  return <span>{content}</span>;
}
```

**Card:** title + a `children` slot.

```tsx
export function CardBlock({ config, slots }: BlockProps) {
  const title = (config as { title?: string }).title ?? "";
  return (
    <div className="playground-card">
      {title ? <div className="playground-card__title">{title}</div> : null}
      <div className="playground-card__children">{slots.children ?? []}</div>
    </div>
  );
}
```

**Row / column:** layout only; pass through `slots.children`.

```tsx
export function RowBlock({ config, slots }: BlockProps) {
  const gap = (config as { gap?: string }).gap ?? "normal";
  const gapClass = gap === "tight" ? "gap-2" : gap === "wide" ? "gap-6" : "gap-4";
  return <div className={`flex flex-row ${gapClass}`}>{slots.children ?? []}</div>;
}

export function ColumnBlock({ config, slots }: BlockProps) {
  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0 playground-card__children min-h-6">
      {slots.children ?? []}
    </div>
  );
}
```

**Button (context-aware):** use `usePageRuntime()` and `getContextValue` / `updateContext` from `@genetik/context-events` to read and toggle a boolean in page context.

```tsx
import { usePageRuntime } from "@genetik/renderer-react";
import { getContextValue } from "@genetik/context-events";

export function ButtonBlock({ config }: BlockProps) {
  const runtime = usePageRuntime();
  const { contextPath = "customContextBoolean", label = "Toggle" } = (config ?? {}) as { contextPath?: string; label?: string };
  const value = getContextValue(runtime?.context, contextPath) as boolean | undefined;
  const next = !(value === true);
  return (
    <button type="button" onClick={() => runtime?.updateContext(contextPath, next)}>
      {label}: {String(value ?? false)} → {String(next)}
    </button>
  );
}
```

## Component map

Build a map from block id to component and pass it to both the editor and the renderer:

```ts
const componentMap: ComponentMap = {
  page: PageBlock,
  text: TextBlock,
  card: CardBlock,
  row: RowBlock,
  column: ColumnBlock,
  image: ImageBlock,
  button: ButtonBlock,
};
```

Next: [Wire up the editor](./wire-up-the-editor) with `EditorProvider`, `BlockPalette`, and `EditorCanvas`.
