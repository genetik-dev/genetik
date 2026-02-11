import type { GenetikContent } from "@genetik/content";
import type { GenetikSchema } from "@genetik/schema";
import type { ComponentMap } from "@genetik/renderer-react";

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
  /** Current drag source when a block/block-type is being dragged; null otherwise. Used to highlight valid drop slots. */
  currentDragSource: CurrentDragSource;
  /** Set when drag starts, clear on drop/cancel. */
  setCurrentDragSource: (source: CurrentDragSource) => void;
}

export interface EditorProviderProps {
  schema: GenetikSchema;
  content: GenetikContent;
  onChange: (content: GenetikContent) => void;
  /** Optional: for rendering block preview inside the canvas. */
  componentMap?: ComponentMap;
}
