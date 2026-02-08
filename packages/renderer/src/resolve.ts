import { parseContentJson } from "@genetik/content";
import type { ContentNode, GenetikContent } from "@genetik/content";
import type { GenetikSchema } from "@genetik/schema";
import { getBlockType } from "@genetik/schema";
import type { ResolvedNode } from "./types.js";

/**
 * Resolves content against a schema into a tree of ResolvedNode. Walks from the
 * entry node and resolves each slot to ordered child ResolvedNodes. Missing
 * nodes (dangling refs) are skipped. Framework-agnostic; use a binding
 * (e.g. @genetik/renderer-react) to map ResolvedNode to UI components.
 *
 * Accepts either a content object or a JSON string (parsed with parseContentJson).
 * Returns null if content is invalid JSON, the entry node is missing, or resolution fails.
 */
export function resolve(
  content: GenetikContent | string,
  schema: GenetikSchema,
): ResolvedNode | null {
  let parsed: GenetikContent | null;
  if (typeof content === "string") {
    const result = parseContentJson(content);
    parsed = result.ok ? result.content : null;
  } else {
    parsed = content;
  }
  if (!parsed) return null;
  const root = parsed.nodes[parsed.entryId];
  if (!root) return null;
  return resolveNode(parsed, schema, root);
}

function resolveNode(
  content: GenetikContent,
  schema: GenetikSchema,
  node: ContentNode
): ResolvedNode {
  const blockType = getBlockType(schema, node.block);
  const slots: Record<string, ResolvedNode[]> = {};

  if (blockType) {
    for (const slotDef of blockType.slots) {
      const value = node[slotDef.name];
      const ids = slotValueToIds(value);
      const children: ResolvedNode[] = [];
      for (const id of ids) {
        const child = content.nodes[id];
        if (child) {
          children.push(resolveNode(content, schema, child));
        }
      }
      slots[slotDef.name] = children;
    }
  }

  return {
    id: node.id,
    block: node.block,
    config: node.config,
    slots,
  };
}

function slotValueToIds(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}
