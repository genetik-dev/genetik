import { useEffect, useRef, useState } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { DRAG_TYPE_BLOCK_TYPE_CONST } from "./block-palette.js";
import { DRAG_TYPE_NODE_CONST } from "./editor-dnd.js";
import { DropPlaceholder } from "./drop-placeholder.js";
import { cn } from "./lib/utils.js";

type DropEdge = "top" | "bottom";

function getClosestEdge(element: Element, clientY: number): DropEdge {
  const rect = element.getBoundingClientRect();
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
  children,
}: {
  nodeId: string;
  parentId: string;
  slotName: string;
  index: number;
  children: React.ReactNode;
}): React.ReactElement {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<BlockDropState>(idleState);

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
        onDragStart: () => setState({ type: "is-dragging" }),
        onDrop: () => setState(idleState),
      }),
      dropTargetForElements({
        element: outer,
        getIsSticky: () => true,
        getData: ({ element, input }) => ({
          type: "before",
          parentId,
          slotName,
          index,
          closestEdge: getClosestEdge(element, input.clientY),
        }),
        canDrop: ({
          source,
        }: {
          source: { data: Record<string, unknown> };
        }) => {
          const t = source.data.type as string;
          return t === DRAG_TYPE_BLOCK_TYPE_CONST || t === DRAG_TYPE_NODE_CONST;
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
          setState((prev) => {
            if (
              prev.type !== "is-over" ||
              prev.closestEdge !== (data.closestEdge ?? "bottom")
            ) {
              const rect = (source.data as { rect?: DOMRect }).rect ?? null;
              return {
                type: "is-over",
                closestEdge: data.closestEdge ?? "bottom",
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
        onDrop: () => setState(idleState),
      }),
    );
  }, [nodeId, parentId, slotName, index]);

  const isOver = state.type === "is-over";
  const placeholderHeight =
    state.type === "is-over" && state.draggingRect
      ? state.draggingRect.height
      : 48;

  return (
    <div
      ref={outerRef}
      className={cn(
        "rounded transition-[opacity] duration-150",
        state.type === "is-dragging" && "opacity-50",
        state.type === "is-dragging-and-left-self" && "hidden",
      )}
      data-drop-over={isOver ? "true" : undefined}
    >
      {isOver && state.closestEdge === "top" ? (
        <DropPlaceholder height={placeholderHeight} />
      ) : null}
      <div ref={innerRef} style={{ touchAction: "none" }}>
        {children}
      </div>
      {isOver && state.closestEdge === "bottom" ? (
        <DropPlaceholder height={placeholderHeight} />
      ) : null}
    </div>
  );
}
