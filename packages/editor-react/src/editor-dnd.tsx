import { useEffect } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useEditor } from "./use-editor.js";
import { DRAG_TYPE_BLOCK_TYPE_CONST } from "./block-palette.js";

const DRAG_TYPE_NODE = "node";

export interface EditorDndProviderProps {
  children: React.ReactNode;
}

/** Registers a global monitor for drag-and-drop and dispatches add/reorder. */
export function EditorDndProvider({ children }: EditorDndProviderProps): React.ReactElement {
  const { content, dispatch, setCurrentDragSource } = useEditor();

  useEffect(() => {
    return monitorForElements({
      onDrop: ({
        source,
        location,
      }: {
        source: { data: Record<string, unknown> };
        location: { current: { dropTargets: Array<{ data: Record<string, unknown> }> } };
      }) => {
        setCurrentDragSource(null);
        const dropTargets = location.current.dropTargets;
        const target = dropTargets[0];
        if (!target) return;

        const targetData = target.data as {
          type: string;
          parentId?: string;
          slotName?: string;
          nodeIds?: string[];
          index?: number;
          closestEdge?: "top" | "bottom" | "left" | "right";
        };
        const sourceData = source.data as {
          type: string;
          blockType?: string;
          nodeId?: string;
          parentId?: string;
          slotName?: string;
        };

        const parentId = targetData.parentId;
        const slotName = targetData.slotName;
        const index = targetData.index ?? 0;

        if (!parentId || !slotName) return;

        const node = content.nodes[parentId];
        const slotVal = node?.[slotName as keyof typeof node];
        const currentOrder: string[] = Array.isArray(slotVal)
          ? slotVal
          : typeof slotVal === "string"
            ? [slotVal]
            : [];

        // Add block from palette
        if (sourceData.type === DRAG_TYPE_BLOCK_TYPE_CONST && sourceData.blockType) {
          const insertAfter =
            targetData.closestEdge === "bottom" || targetData.closestEdge === "right";
          const position =
            targetData.type === "slot"
              ? currentOrder.length
              : insertAfter
                ? Math.min(index + 1, currentOrder.length)
                : index;
          dispatch({
            type: "addBlock",
            parentId,
            slotName,
            blockType: sourceData.blockType,
            position,
          });
          return;
        }

        // Move node (same slot reorder or cross-slot move)
        if (
          sourceData.type === DRAG_TYPE_NODE &&
          sourceData.nodeId &&
          sourceData.parentId != null &&
          sourceData.slotName != null
        ) {
          const sourceIndex =
            parentId === sourceData.parentId && slotName === sourceData.slotName
              ? currentOrder.indexOf(sourceData.nodeId)
              : -1;
          const isMovingDown = sourceIndex >= 0 && sourceIndex < (index ?? 0);
          const insertAfter =
            targetData.closestEdge === "bottom" || targetData.closestEdge === "right";
          const toIndex =
            targetData.type === "slot"
              ? currentOrder.length
              : insertAfter
                ? isMovingDown
                  ? index ?? 0
                  : Math.min((index ?? 0) + 1, currentOrder.length)
                : Math.max(0, index ?? 0);
          dispatch({
            type: "moveNode",
            nodeId: sourceData.nodeId,
            fromParentId: sourceData.parentId,
            fromSlotName: sourceData.slotName,
            toParentId: parentId,
            toSlotName: slotName,
            toIndex,
          });
        }
      },
    });
  }, [content, dispatch]);

  return <>{children}</>;
}

export const DRAG_TYPE_NODE_CONST = DRAG_TYPE_NODE;
