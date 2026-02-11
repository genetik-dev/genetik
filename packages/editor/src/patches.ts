import type { ContentNode, GenetikContent } from "@genetik/content";
import type { Patch } from "@genetik/patches";
import type { GenetikSchema } from "@genetik/schema";
import { generateNodeId } from "./id.js";
import { getDefaultConfig } from "./schema-helpers.js";

export interface CreateAddToSlotOptions {
  /** Index in the slot to insert at; default append. */
  position?: number;
}

/**
 * Creates a patch that adds a new node and inserts it into the given slot.
 * Generates a new node id and uses default config for the block type.
 */
export function createAddToSlotPatch(
  content: GenetikContent,
  schema: GenetikSchema,
  parentId: string,
  slotName: string,
  blockType: string,
  options?: CreateAddToSlotOptions
): Patch {
  const parent = content.nodes[parentId];
  if (!parent) {
    throw new Error(`Parent node not found: ${parentId}`);
  }

  const id = generateNodeId();
  const config = getDefaultConfig(schema, blockType);
  const node: ContentNode = { id, block: blockType, config };

  const currentSlot = parent[slotName];
  const currentOrder = Array.isArray(currentSlot)
    ? [...(currentSlot as string[])]
    : typeof currentSlot === "string"
      ? [currentSlot]
      : [];

  const position = options?.position ?? currentOrder.length;
  const newOrder = [...currentOrder];
  newOrder.splice(Math.max(0, position), 0, id);

  return [
    { type: "addNode", id, node },
    { type: "reorderSlot", id: parentId, slotName, order: newOrder },
  ];
}

/**
 * Creates a patch that removes a node (and removes its id from any slot referencing it).
 */
export function createRemovePatch(_content: GenetikContent, nodeId: string): Patch {
  return { type: "removeNode", id: nodeId };
}

/**
 * Creates a patch that sets a slot to a new order of node ids.
 */
export function createReorderPatch(
  _content: GenetikContent,
  parentId: string,
  slotName: string,
  order: string[]
): Patch {
  return { type: "reorderSlot", id: parentId, slotName, order: [...order] };
}

function getSlotOrder(content: GenetikContent, parentId: string, slotName: string): string[] {
  const parent = content.nodes[parentId];
  if (!parent) return [];
  const slotVal = parent[slotName as keyof ContentNode];
  return Array.isArray(slotVal)
    ? [...slotVal]
    : typeof slotVal === "string"
      ? [slotVal]
      : [];
}

/**
 * Creates a patch that moves an existing node from one slot to another (or to another index in the same slot).
 * Same slot: one reorderSlot. Different slot: two reorderSlot ops (remove from source, insert into target).
 */
export function createMoveToSlotPatch(
  content: GenetikContent,
  nodeId: string,
  fromParentId: string,
  fromSlotName: string,
  toParentId: string,
  toSlotName: string,
  toIndex: number
): Patch {
  const fromOrder = getSlotOrder(content, fromParentId, fromSlotName);
  const isSameSlot = fromParentId === toParentId && fromSlotName === toSlotName;

  if (isSameSlot) {
    const reordered = fromOrder.filter((id) => id !== nodeId);
    reordered.splice(Math.max(0, Math.min(toIndex, reordered.length)), 0, nodeId);
    return { type: "reorderSlot", id: toParentId, slotName: toSlotName, order: reordered };
  }

  const newFromOrder = fromOrder.filter((id) => id !== nodeId);
  const toOrder = getSlotOrder(content, toParentId, toSlotName);
  const newToOrder = [...toOrder];
  newToOrder.splice(Math.max(0, Math.min(toIndex, newToOrder.length)), 0, nodeId);

  return [
    { type: "reorderSlot", id: fromParentId, slotName: fromSlotName, order: newFromOrder },
    { type: "reorderSlot", id: toParentId, slotName: toSlotName, order: newToOrder },
  ];
}

/**
 * Creates a patch that updates a node's config.
 */
export function createUpdateConfigPatch(
  content: GenetikContent,
  nodeId: string,
  config: Record<string, unknown>
): Patch {
  const node = content.nodes[nodeId];
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }
  return { type: "updateConfig", id: nodeId, config: { ...config } };
}
