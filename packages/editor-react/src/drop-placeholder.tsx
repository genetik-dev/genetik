import { EditorDropPlaceholder } from "@genetik/ui-react";

/** Placeholder shown where a dragged block would land. Uses ui-react EditorDropPlaceholder. */
export function DropPlaceholder({
  height = 48,
  width,
  stretchHeight,
  minWidth,
}: {
  height?: number;
  /** When set, placeholder is sized for horizontal (left/right) insertion. */
  width?: number;
  /** When true, placeholder stretches to container height (e.g. in a flex row). */
  stretchHeight?: boolean;
  /** Minimum width when width is set. */
  minWidth?: number;
}): React.ReactElement {
  return (
    <EditorDropPlaceholder
      height={height}
      width={width}
      stretchHeight={stretchHeight}
      minWidth={minWidth}
    />
  );
}
