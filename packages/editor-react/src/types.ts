import type { RefObject } from "react";
import type { GenetikContent } from "@genetik/content";
import type { GenetikSchema } from "@genetik/schema";
import type { ComponentMap } from "@genetik/renderer-react";
import type { PageContext } from "@genetik/context-events";

export interface AddBlockAction {
  type: "addBlock";
  parentId: string;
  slotName: string;
  blockType: string;
  position?: number;
}

export interface RemoveBlockAction {
  type: "removeBlock";
  nodeId: string;
}

export interface ReorderSlotAction {
  type: "reorderSlot";
  parentId: string;
  slotName: string;
  order: string[];
}

export interface MoveNodeAction {
  type: "moveNode";
  nodeId: string;
  fromParentId: string;
  fromSlotName: string;
  toParentId: string;
  toSlotName: string;
  toIndex: number;
}

export interface UpdateBlockConfigAction {
  type: "updateBlockConfig";
  nodeId: string;
  config: Record<string, unknown>;
}

export type EditorAction =
  | AddBlockAction
  | RemoveBlockAction
  | ReorderSlotAction
  | MoveNodeAction
  | UpdateBlockConfigAction;

/** Source of the currently dragged item (set when drag starts, cleared on drop/cancel). */
export type CurrentDragSource =
  | { type: "blockType"; blockType: string }
  | { type: "node"; nodeId: string; blockType: string }
  | null;

export interface EditorContextValue {
  content: GenetikContent;
  schema: GenetikSchema;
  /** Called when content changes (after applying a patch). */
  onChange: (content: GenetikContent) => void;
  /** Dispatch an action; editor applies patch and calls onChange. */
  dispatch: (action: EditorAction) => void;
  /** Block type names allowed for the palette / add-block. */
  allowedBlockTypes: string[];
  /** Optional: component map for rendering block preview in the canvas. */
  componentMap?: ComponentMap;
  /** Optional: page context for preview; when set, context overrides (e.g. visibility) are applied in the canvas. */
  context?: PageContext;
  /** Optional: called when a block updates context (e.g. button toggle); enables visibility/override updates in the canvas. */
  onContextUpdate?: (path: string, value: unknown) => void;
  /** Current drag source when a block/block-type is being dragged; null otherwise. Used to highlight valid drop slots. */
  currentDragSource: CurrentDragSource;
  /** Set when drag starts, clear on drop/cancel. */
  setCurrentDragSource: (source: CurrentDragSource) => void;
  /** Optional container for portaled UI (e.g. Select dropdowns); use when Tailwind is scoped so portaled content stays inside the scope. */
  portalContainer?: HTMLElement | RefObject<HTMLElement | null> | null;
}

export interface EditorProviderProps {
  schema: GenetikSchema;
  content: GenetikContent;
  onChange: (content: GenetikContent) => void;
  /** Optional: for rendering block preview inside the canvas. */
  componentMap?: ComponentMap;
  /** Optional: page context for the canvas; when set, context overrides (e.g. visibility) are applied and blocks receive context/updateContext. */
  context?: PageContext;
  /** Optional: called when a block updates context; pass to enable interactive context (e.g. toggle button) in the canvas. */
  onContextUpdate?: (path: string, value: unknown) => void;
  /** Optional: container for portaled UI (e.g. config panel Selects); use when Tailwind is scoped to a [data-twp] div. */
  portalContainer?: HTMLElement | RefObject<HTMLElement | null> | null;
}
