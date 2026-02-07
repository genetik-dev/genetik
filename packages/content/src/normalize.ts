import type { GenetikSchema } from "@genetik/schema";
import { getBlockType } from "@genetik/schema";
import { nanoid } from "nanoid";
import type { ContentNode, GenetikContent, GenetikContentInput } from "./types.js";

export interface NormalizeOptions {
  /** Id generator for new nodes from inline. Defaults to nanoid. */
  generateId?: () => string;
}

/**
 * Normalizes content that may contain inline nodes in slots (when schema allows)
 * to canonical flat form. Inline nodes are flattened, assigned ids, and slot
 * values become id references. Id-only slots are left unchanged.
 */
export function normalizeContent(
  schema: GenetikSchema,
  input: GenetikContentInput,
  options?: NormalizeOptions
): GenetikContent {
  const generateId = options?.generateId ?? nanoid;
  const resultNodes: Record<string, ContentNode> = {};

  for (const [nodeId, inputNode] of Object.entries(input.nodes)) {
    const { node, extraNodes } = normalizeNode(schema, inputNode as Record<string, unknown>, nodeId, generateId);
    resultNodes[nodeId] = node;
    Object.assign(resultNodes, extraNodes);
  }

  return {
    entryId: input.entryId,
    nodes: resultNodes,
  };
}

function normalizeNode(
  schema: GenetikSchema,
  input: Record<string, unknown>,
  nodeId: string,
  generateId: () => string
): { node: ContentNode; extraNodes: Record<string, ContentNode> } {
  const block = input.block as string;
  const blockType = getBlockType(schema, block);
  const config = (input.config as Record<string, unknown>) ?? {};

  if (!blockType) {
    const node: ContentNode = { id: nodeId, block, config };
    for (const k of Object.keys(input)) {
      if (k === "id" || k === "block" || k === "config") continue;
      const v = input[k];
      if (typeof v === "string" || (Array.isArray(v) && v.every((x) => typeof x === "string"))) node[k] = v;
    }
    return { node, extraNodes: {} };
  }

  const node: ContentNode = { id: nodeId, block, config };
  let extraNodes: Record<string, ContentNode> = {};

  for (const slotDef of blockType.slots) {
    const value = input[slotDef.name];
    if (value === undefined || value === null) continue;

    if (slotDef.referenceMode === "id") {
      node[slotDef.name] = value;
      continue;
    }

    if (slotDef.multiple) {
      const arr = Array.isArray(value) ? value : [value];
      const ids: string[] = [];
      for (const item of arr) {
        if (typeof item === "string") {
          ids.push(item);
        } else if (isInlineNode(item)) {
          const childId = generateId();
          const { node: childNode, extraNodes: childExtras } = normalizeNode(
            schema,
            item as Record<string, unknown>,
            childId,
            generateId
          );
          ids.push(childId);
          extraNodes = { ...extraNodes, ...childExtras, [childId]: childNode };
        }
      }
      node[slotDef.name] = ids;
    } else {
      if (typeof value === "string") {
        node[slotDef.name] = value;
      } else if (isInlineNode(value)) {
        const childId = generateId();
        const { node: childNode, extraNodes: childExtras } = normalizeNode(
          schema,
          value as Record<string, unknown>,
          childId,
          generateId
        );
        node[slotDef.name] = childId;
        extraNodes = { ...extraNodes, ...childExtras, [childId]: childNode };
      }
    }
  }

  return { node, extraNodes };
}

function isInlineNode(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) && "block" in value;
}
