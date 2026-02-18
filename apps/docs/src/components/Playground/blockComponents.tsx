import type { BlockProps } from "@genetik/renderer-react";
import { usePageRuntime } from "@genetik/renderer-react";
import { getContextValue } from "@genetik/context-events";

/** Page: root-only block; wraps the main content. */
export function PageBlock({ slots }: BlockProps) {
  return <div className="playground-page">{slots.children ?? []}</div>;
}

export function TextBlock({ config }: BlockProps) {
  const content = (config as { content?: string }).content ?? "";
  return <span>{content}</span>;
}

export function CardBlock({ config, slots }: BlockProps) {
  const title = (config as { title?: string }).title ?? "";
  return (
    <div className="playground-card">
      {title ? <div className="playground-card__title">{title}</div> : null}
      <div className="playground-card__children">{slots.children ?? []}</div>
    </div>
  );
}

/** Row: lays out children horizontally (any number of columns). */
export function RowBlock({ config, slots }: BlockProps) {
  const gap = (config as { gap?: string }).gap ?? "normal";
  const gapClass =
    gap === "tight" ? "gap-2" : gap === "wide" ? "gap-6" : "gap-4";
  return (
    <div className={`flex flex-row ${gapClass}`}>{slots.children ?? []}</div>
  );
}

/** Column: lays out children vertically. */
export function ColumnBlock({ config, slots }: BlockProps) {
  return (
    <div className="flex flex-col gap-2 flex-1 min-w-0 playground-card__children min-h-6">
      {slots.children ?? []}
    </div>
  );
}

export function ImageBlock({ config }: BlockProps) {
  const {
    src = "",
    alt = "",
    caption = "",
  } = (config ?? {}) as {
    src?: string;
    alt?: string;
    caption?: string;
  };
  return (
    <figure className="playground-card overflow-hidden">
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-auto block"
          loading="lazy"
        />
      ) : (
        <div className="aspect-video bg-[var(--ifm-color-emphasis-200)] flex items-center justify-center text-[var(--ifm-color-emphasis-600)] text-sm">
          No image URL
        </div>
      )}
      {caption ? (
        <figcaption className="p-2 text-sm text-[var(--ifm-color-emphasis-600)] border-t border-[var(--ifm-color-emphasis-200)]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Button: toggles a boolean in page context. Config.contextPath sets which key to toggle. */
export function ButtonBlock({ config }: BlockProps) {
  const runtime = usePageRuntime();
  const { contextPath = "customContextBoolean", label = "Toggle" } = (config ?? {}) as {
    contextPath?: string;
    label?: string;
  };
  if (!runtime) {
    return (
      <span className="text-sm text-[var(--ifm-color-emphasis-500)]">
        No context (button needs page runtime)
      </span>
    );
  }
  const value = getContextValue(runtime.context, contextPath) as boolean | undefined;
  const next = !(value === true);
  return (
    <button
      type="button"
      className="px-3 py-1.5 text-sm rounded-lg border border-[var(--ifm-color-emphasis-300)] bg-[var(--ifm-color-emphasis-100)] hover:bg-[var(--ifm-color-emphasis-200)]"
      onClick={() => runtime.updateContext(contextPath, next)}
    >
      {label}: {String(value ?? false)} → {String(next)}
    </button>
  );
}
