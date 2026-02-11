import { useEffect, useRef, useState } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { DRAG_TYPE_BLOCK_TYPE_CONST } from "./block-palette.js";
import { DRAG_TYPE_NODE_CONST } from "./editor-dnd.js";
import { DropPlaceholder } from "./drop-placeholder.js";
import { useEditor } from "./use-editor.js";
import { cn } from "./lib/utils.js";

type DropEdge = "top" | "bottom" | "left" | "right";

function getClosestEdge(
  element: Element,
  clientX: number,
  clientY: number,
  layout: "row" | "column" | undefined
): DropEdge {
  const rect = element.getBoundingClientRect();
  if (layout === "row") {
    const midX = rect.left + rect.width / 2;
    return clientX < midX ? "left" : "right";
  }
  const midY = rect.top + rect.height / 2;
  return clientY < midY ? "top" : "bottom";
}

type BlockDropState =
  | { type: "idle" }
  | { type: "is-dragging" }
  | { type: "is-dragging-and-left-self" }
  | { type: "is-over"; closestEdge: DropEdge; draggingRect: DOMRect | null };

const idleState: BlockDropState = { type: "idle" };

export function DraggableBlockWrapper({
  nodeId,
  parentId,
  slotName,
  index,
  slotLayout,
  slotAllowedBlockTypes,
  slotMultiple = true,
  children,
}: {
  nodeId: string;
  parentId: string;
  slotName: string;
  index: number;
  /** When "row", placeholder is shown left/right; otherwise above/below. */
  slotLayout?: "row" | "column";
  /** When set, only these block types can be dropped. Omit to allow all. */
  slotAllowedBlockTypes?: string[];
  /** When false, slot accepts at most one block. Default true. */
  slotMultiple?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<BlockDropState>(idleState);
  const { content, setCurrentDragSource } = useEditor();

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    return combine(
      draggable({
        element: inner,
        getInitialData: () => ({
          type: DRAG_TYPE_NODE_CONST,
          nodeId,
          parentId,
          slotName,
          rect: inner.getBoundingClientRect(),
        }),
        onDragStart: () => {
          setState({ type: "is-dragging" });
          const blockType = content.nodes[nodeId]?.block as string | undefined;
          if (blockType) setCurrentDragSource({ type: "node", nodeId, blockType });
        },
        onDrop: () => {
          setState(idleState);
          setCurrentDragSource(null);
        },
      }),
      dropTargetForElements({
        element: outer,
        getIsSticky: () => true,
        getData: ({ element, input }) => ({
          type: "before",
          parentId,
          slotName,
          index,
          closestEdge: getClosestEdge(element, input.clientX, input.clientY, slotLayout),
        }),
        canDrop: ({
          source,
        }: {
          source: { data: Record<string, unknown> };
        }) => {
          const slotVal = content.nodes[parentId]?.[slotName as keyof (typeof content.nodes)[string]];
          const currentOrder: string[] = Array.isArray(slotVal)
            ? slotVal
            : typeof slotVal === "string"
              ? [slotVal]
              : [];
          if (slotMultiple === false && currentOrder.length >= 1) {
            const t = source.data.type as string;
            if (t === DRAG_TYPE_BLOCK_TYPE_CONST) return false;
            if (t === DRAG_TYPE_NODE_CONST) {
              const sourceNodeId = source.data.nodeId as string | undefined;
              if (!sourceNodeId) return false;
              if (!currentOrder.includes(sourceNodeId)) return false;
            }
          }
          const t = source.data.type as string;
          if (t === DRAG_TYPE_BLOCK_TYPE_CONST) {
            const blockType = source.data.blockType as string | undefined;
            if (!blockType) return false;
            if (slotAllowedBlockTypes === undefined) return true;
            return slotAllowedBlockTypes.includes(blockType);
          }
          if (t === DRAG_TYPE_NODE_CONST) {
            const sourceNodeId = source.data.nodeId as string | undefined;
            if (!sourceNodeId) return false;
            const node = content.nodes[sourceNodeId];
            const blockType = node?.block as string | undefined;
            if (!blockType) return false;
            if (slotAllowedBlockTypes === undefined) return true;
            return slotAllowedBlockTypes.includes(blockType);
          }
          return false;
        },
        onDragEnter: ({ source, self, location }) => {
          if (
            source.data.type === DRAG_TYPE_NODE_CONST &&
            (source.data as { nodeId?: string }).nodeId === nodeId
          )
            return;
          if (location.current.dropTargets[0]?.element !== self.element) return;
          const data = self.data as { closestEdge?: DropEdge };
          const rect = (source.data as { rect?: DOMRect }).rect ?? null;
          setState({
            type: "is-over",
            closestEdge: data.closestEdge ?? "bottom",
            draggingRect: rect ?? null,
          });
        },
        onDrag: ({ source, self, location }) => {
          if (
            source.data.type === DRAG_TYPE_NODE_CONST &&
            (source.data as { nodeId?: string }).nodeId === nodeId
          )
            return;
          if (location.current.dropTargets[0]?.element !== self.element) {
            setState(idleState);
            return;
          }
          const data = self.data as { closestEdge?: DropEdge };
          const defaultEdge: DropEdge = slotLayout === "row" ? "right" : "bottom";
          setState((prev) => {
            if (
              prev.type !== "is-over" ||
              prev.closestEdge !== (data.closestEdge ?? defaultEdge)
            ) {
              const rect = (source.data as { rect?: DOMRect }).rect ?? null;
              return {
                type: "is-over",
                closestEdge: data.closestEdge ?? defaultEdge,
                draggingRect: rect ?? null,
              };
            }
            return prev;
          });
        },
        onDragLeave: ({ source }) => {
          if (
            source.data.type === DRAG_TYPE_NODE_CONST &&
            (source.data as { nodeId?: string }).nodeId === nodeId
          ) {
            setState({ type: "is-dragging-and-left-self" });
            return;
          }
          setState(idleState);
        },
        onDrop: () => {
          setState(idleState);
          setCurrentDragSource(null);
        },
      }),
    );
  }, [nodeId, parentId, slotName, index, slotLayout, slotAllowedBlockTypes, slotMultiple, content.nodes, setCurrentDragSource]);

  const isOver = state.type === "is-over";
  const draggingRect = state.type === "is-over" && state.draggingRect ? state.draggingRect : null;
  const placeholderHeight = draggingRect ? draggingRect.height : 48;
  const placeholderWidth = draggingRect ? Math.max(draggingRect.width, 80) : 80;
  const isHorizontal = slotLayout === "row";

  return (
    <div
      ref={outerRef}
      className={cn(
        "rounded transition-[opacity] duration-150",
        slotLayout === "row" && "flex flex-1 min-w-0 flex-row items-stretch",
        state.type === "is-dragging" && "opacity-50",
        state.type === "is-dragging-and-left-self" && "hidden",
      )}
      data-drop-over={isOver ? "true" : undefined}
    >
      {isOver && (state.closestEdge === "top" || state.closestEdge === "left") ? (
        <DropPlaceholder
          height={placeholderHeight}
          width={isHorizontal ? placeholderWidth : undefined}
          stretchHeight={isHorizontal}
          minWidth={isHorizontal ? 80 : undefined}
        />
      ) : null}
      <div ref={innerRef} className={cn(slotLayout === "row" && "min-w-0 flex-1")} style={{ touchAction: "none" }}>
        {children}
      </div>
      {isOver && (state.closestEdge === "bottom" || state.closestEdge === "right") ? (
        <DropPlaceholder
          height={placeholderHeight}
          width={isHorizontal ? placeholderWidth : undefined}
          stretchHeight={isHorizontal}
          minWidth={isHorizontal ? 80 : undefined}
        />
      ) : null}
    </div>
  );
}
