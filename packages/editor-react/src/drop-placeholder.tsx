/** Placeholder shown where a dragged block would land */
export function DropPlaceholder({
  height = 48,
}: {
  height?: number;
}): React.ReactElement {
  return (
    <div
      className="shrink-0 rounded bg-(--editor-drop-border,#2563eb)/20 border border-(--editor-drop-border,#2563eb) border-dashed min-h-8"
      style={{ height: `${Math.max(height, 32)}px` }}
      aria-hidden
    />
  );
}
