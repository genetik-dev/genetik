import { cn } from "@/lib/utils";

/** Placeholder shown where a dragged block would land. Editor-agnostic UI only. */
export function EditorDropPlaceholder({
  height = 48,
  width,
  stretchHeight,
  minWidth = 32,
  className,
}: {
  height?: number;
  /** When set, placeholder is sized for horizontal (left/right) insertion. */
  width?: number;
  /** When true, do not set fixed height so the placeholder stretches to container height (e.g. in a flex row). */
  stretchHeight?: boolean;
  /** Minimum width when width is set (default 32). Use e.g. 80 for a wider bar. */
  minWidth?: number;
  className?: string;
}): React.ReactElement {
  const style: React.CSSProperties = {};
  if (stretchHeight) {
    style.minHeight = 32;
  } else {
    style.height = `${Math.max(height ?? 48, 32)}px`;
  }
  if (width !== undefined) {
    style.width = `${Math.max(width, minWidth)}px`;
    style.minWidth = style.width;
  }
  return (
    <div
      className={cn(
        "shrink-0 min-h-8 rounded border border-dashed border-primary/50 bg-primary/10",
        className
      )}
      style={style}
      aria-hidden
    />
  );
}
