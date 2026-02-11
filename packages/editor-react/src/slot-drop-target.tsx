import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Button } from "@genetik/ui-react";
import { SlotPopover } from "./slot-popover.js";
import { cn } from "./lib/utils.js";
import { DRAG_TYPE_BLOCK_TYPE_CONST } from "./block-palette.js";
import { DRAG_TYPE_NODE_CONST } from "./editor-dnd.js";
import { useEditor } from "./use-editor.js";

export interface SlotDropTargetProps {
  parentId: string;
  slotName: string;
  nodeIds: string[];
  children?: ReactNode;
  className?: string;
  /** When set, the slot container uses flex so children match the block's layout (e.g. row = horizontal). */
  layout?: "row" | "column";
  /** When set, only these block types can be dropped in this slot. Omit to allow all. */
  allowedBlockTypes?: string[];
  /** When false, slot accepts at most one block; add/drop of a second is prevented. Default true. */
  multiple?: boolean;
}

export function SlotDropTarget({
  parentId,
  slotName,
  nodeIds,
  children,
  className,
  layout,
  allowedBlockTypes,
  multiple = true,
}: SlotDropTargetProps): React.ReactElement {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isOver, setIsOver] = useState(false);
  const { content, currentDragSource } = useEditor();

  const slotFull = multiple === false && nodeIds.length >= 1;
  const isValidDropTarget =
    !slotFull &&
    currentDragSource &&
    (currentDragSource.type === "blockType"
      ? allowedBlockTypes === undefined || allowedBlockTypes.includes(currentDragSource.blockType)
      : allowedBlockTypes === undefined || allowedBlockTypes.includes(currentDragSource.blockType));

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
        if (slotFull) return false;
        const t = source.data.type as string;
        if (t === DRAG_TYPE_BLOCK_TYPE_CONST) {
          const blockType = source.data.blockType as string | undefined;
          if (!blockType) return false;
          if (allowedBlockTypes === undefined) return true;
          return allowedBlockTypes.includes(blockType);
        }
        if (t === DRAG_TYPE_NODE_CONST) {
          const nodeId = source.data.nodeId as string | undefined;
          if (!nodeId) return false;
          const node = content.nodes[nodeId];
          const blockType = node?.block as string | undefined;
          if (!blockType) return false;
          if (allowedBlockTypes === undefined) return true;
          return allowedBlockTypes.includes(blockType);
        }
        return false;
      },
      // Only show slot feedback when this slot is the innermost drop target and the drag is allowed
      onDropTargetChange: ({ source, location, self }) => {
        if (location.current.dropTargets[0]?.element !== self.element) {
          setIsOver(false);
          return;
        }
        const t = source.data.type as string;
        if (t === DRAG_TYPE_BLOCK_TYPE_CONST) {
          const blockType = source.data.blockType as string | undefined;
          setIsOver(
            !!blockType && (allowedBlockTypes === undefined || allowedBlockTypes.includes(blockType))
          );
        } else if (t === DRAG_TYPE_NODE_CONST) {
          const nodeId = source.data.nodeId as string | undefined;
          const node = nodeId ? content.nodes[nodeId] : undefined;
          const blockType = node?.block as string | undefined;
          setIsOver(
            !!blockType && (allowedBlockTypes === undefined || allowedBlockTypes.includes(blockType))
          );
        } else {
          setIsOver(false);
        }
      },
      onDrop: () => setIsOver(false),
    });
  }, [parentId, slotName, nodeIds, allowedBlockTypes, content.nodes, multiple]);

  return (
    <div
      ref={ref}
      className={cn(
        "w-full min-h-8 rounded-md border-2 border-dashed p-2 transition-colors duration-150",
        layout === "row" && "flex flex-row flex-wrap items-stretch gap-2",
        layout === "column" && "flex flex-col gap-2",
        isOver && "border-2 bg-(--editor-drop-bg,#eff6ff)",
        !isOver && "border-[#ccc]",
        isValidDropTarget && !isOver && "ring-2 ring-blue-400 ring-offset-1",
        className,
      )}
      data-slot={slotName}
      data-drop-over={isOver ? "true" : undefined}
      data-drop-valid={isValidDropTarget && !isOver ? "true" : undefined}
    >
      {children}

      {!slotFull && (
        <SlotPopover
          parentId={parentId}
          slotName={slotName}
          position={nodeIds.length}
          allowedBlockTypes={allowedBlockTypes}
        >
          <Button type="button" size="sm" className="mt-2">
            + Add block
          </Button>
        </SlotPopover>
      )}
    </div>
  );
}
