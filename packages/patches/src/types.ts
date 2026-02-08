import type { ContentNode, GenetikContent } from "@genetik/content";

/**
 * Add a node to the content. The node must have a unique id.
 * Does not attach it to any slot; use reorderSlot to place it.
 */
export interface AddNodeOp {
  type: "addNode";
  /** Id for the new node (must not already exist in content). */
  id: string;
  /** The node to add. */
  node: ContentNode;
}

/**
 * Remove a node and remove its id from any slot that references it.
 */
export interface RemoveNodeOp {
  type: "removeNode";
  id: string;
}

/**
 * Replace a node's config.
 */
export interface UpdateConfigOp {
  type: "updateConfig";
  id: string;
  config: Record<string, unknown>;
}

/**
 * Set a slot to an ordered list of node ids.
 */
export interface ReorderSlotOp {
  type: "reorderSlot";
  /** Node whose slot to update. */
  id: string;
  slotName: string;
  /** New ordered list of node ids for this slot. */
  order: string[];
}

/**
 * A single patch operation.
 */
export type PatchOp = AddNodeOp | RemoveNodeOp | UpdateConfigOp | ReorderSlotOp;

/**
 * A patch is one operation or a sequence of operations applied in order.
 */
export type Patch = PatchOp | PatchOp[];

export type { ContentNode, GenetikContent };
