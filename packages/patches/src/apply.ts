import type { ContentNode, GenetikContent } from "@genetik/content";
import type { Patch, PatchOp } from "./types.js";

/**
 * Applies a patch to content and returns new content. Does not mutate the input.
 * Operations are applied in order. Does not validate the result (e.g. link integrity).
 */
export function applyPatch(content: GenetikContent, patch: Patch): GenetikContent {
  const ops = Array.isArray(patch) ? patch : [patch];
  let result = content;
  for (const op of ops) {
    result = applyOp(result, op);
  }
  return result;
}

function applyOp(content: GenetikContent, op: PatchOp): GenetikContent {
  switch (op.type) {
    case "addNode":
      return applyAddNode(content, op);
    case "removeNode":
      return applyRemoveNode(content, op);
    case "updateConfig":
      return applyUpdateConfig(content, op);
    case "reorderSlot":
      return applyReorderSlot(content, op);
  }
}

function applyAddNode(content: GenetikContent, op: { id: string; node: ContentNode }): GenetikContent {
  const nodes = { ...content.nodes, [op.id]: { ...op.node } };
  return { ...content, nodes };
}

function applyRemoveNode(content: GenetikContent, op: { id: string }): GenetikContent {
  const nodes: Record<string, ContentNode> = {};
  for (const [id, node] of Object.entries(content.nodes)) {
    if (id === op.id) continue;
    const updated = removeIdFromNodeSlots(node, op.id);
    if (updated !== null) nodes[id] = updated;
  }
  return { ...content, nodes };
}

function removeIdFromNodeSlots(node: ContentNode, removeId: string): ContentNode | null {
  let changed = false;
  const out: ContentNode = { id: node.id, block: node.block, config: node.config };
  for (const [key, value] of Object.entries(node)) {
    if (key === "id" || key === "block" || key === "config") continue;
    if (Array.isArray(value)) {
      const filtered = value.filter((id) => id !== removeId);
      if (filtered.length !== value.length) changed = true;
      out[key] = filtered;
    } else if (value === removeId) {
      changed = true;
      // omit this slot (undefined)
    } else {
      out[key] = value;
    }
  }
  return changed ? out : node;
}

function applyUpdateConfig(
  content: GenetikContent,
  op: { id: string; config: Record<string, unknown> }
): GenetikContent {
  const node = content.nodes[op.id];
  if (!node) return content;
  const nodes = {
    ...content.nodes,
    [op.id]: { ...node, config: { ...op.config } },
  };
  return { ...content, nodes };
}

function applyReorderSlot(
  content: GenetikContent,
  op: { id: string; slotName: string; order: string[] }
): GenetikContent {
  const node = content.nodes[op.id];
  if (!node) return content;
  const nodes = {
    ...content.nodes,
    [op.id]: { ...node, [op.slotName]: [...op.order] },
  };
  return { ...content, nodes };
}
