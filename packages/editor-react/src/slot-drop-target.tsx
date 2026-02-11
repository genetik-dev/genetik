import { useEffect, useRef, useState } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { cn } from "./lib/utils.js";
import { DRAG_TYPE_BLOCK_TYPE_CONST } from "./block-palette.js";
import type { ReactNode } from "react";

const DRAG_TYPE_NODE = "node";

export interface SlotDropTargetProps {
  parentId: string;
  slotName: string;
  nodeIds: string[];
  children?: ReactNode;
  className?: string;
  onAddClick?: () => void;
}

export function SlotDropTarget({
  parentId,
  slotName,
  nodeIds,
  children,
  className,
  onAddClick,
}: SlotDropTargetProps): React.ReactElement {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({
        type: "slot",
        parentId,
        slotName,
        nodeIds,
        index: nodeIds.length,
      }),
      canDrop: ({ source }: { source: { data: Record<string, unknown> } }) => {
        const t = source.data.type as string;
        return t === DRAG_TYPE_BLOCK_TYPE_CONST || t === DRAG_TYPE_NODE;
      },
      // Only show slot feedback when this slot is the innermost drop target (pointer over empty slot area, not a child block)
      onDropTargetChange: ({ location, self }) =>
        setIsOver(location.current.dropTargets[0]?.element === self.element),
      onDrop: () => setIsOver(false),
    });
  }, [parentId, slotName, nodeIds]);

  return (
    <div
      ref={ref}
      className={cn(
        "min-h-8 rounded-md border-2 border-dashed p-2 transition-colors duration-150",
        isOver
          ? "border-2 border-(--editor-drop-border,#2563eb) bg-(--editor-drop-bg,#eff6ff)"
          : "border-[#ccc]",
        className,
      )}
      data-slot={slotName}
      data-drop-over={isOver ? "true" : undefined}
    >
      {children}
      {isOver && (
        <div
          className="mt-1.5 shrink-0 rounded border border-dashed border-(--editor-drop-border,#2563eb) bg-(--editor-drop-border,#2563eb)/10 min-h-8"
          aria-hidden
        />
      )}
      <button
        type="button"
        onClick={onAddClick}
        className="mt-1 rounded px-2 py-1 text-xs opacity-80"
      >
        + Add block
      </button>
    </div>
  );
}
