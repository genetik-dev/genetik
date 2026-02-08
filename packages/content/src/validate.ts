import type { GenetikSchema } from "@genetik/schema";
import { getBlockType } from "@genetik/schema";
import { validateConfigAgainstDefinition } from "@genetik/schema";
import type { ContentNode } from "./types.js";

export interface ContentValidationError {
  /** Path to the problem (e.g. "nodes.a", "nodes.a.config"). */
  path: string;
  /** Human-readable message. */
  message: string;
}

export interface ContentValidationResult {
  valid: boolean;
  errors: ContentValidationError[];
}

/**
 * Validates content against a schema. Checks:
 * - entryId is present and exists in nodes
 * - Every node has id, block, config; block type exists in schema
 * - Each node's config is valid against the block's JSON Schema
 * - Slot values are id or id[] per slot definition; no extra slot keys
 * - All referenced ids exist in the node map (link integrity)
 */
export function validateContent(
  schema: GenetikSchema,
  content: unknown
): ContentValidationResult {
  const errors: ContentValidationError[] = [];

  if (content === null || typeof content !== "object" || Array.isArray(content)) {
    return {
      valid: false,
      errors: [{ path: "", message: "Content must be an object" }],
    };
  }

  const c = content as Record<string, unknown>;
  const entryId = c.entryId;
  const nodes = c.nodes;

  if (typeof entryId !== "string" || entryId === "") {
    errors.push({ path: "entryId", message: "entryId must be a non-empty string" });
  }

  if (nodes === null || typeof nodes !== "object" || Array.isArray(nodes)) {
    errors.push({ path: "nodes", message: "nodes must be an object (map of id to node)" });
  }

  const nodeMap = nodes as Record<string, unknown> | undefined;
  const allIds = new Set<string>(nodeMap ? Object.keys(nodeMap) : []);

  if (nodeMap) {
    for (const [key, val] of Object.entries(nodeMap)) {
      const nodeError = validateNode(schema, key, val, "nodes");
      if (nodeError) errors.push(nodeError);
    }
  }

  if (typeof entryId === "string" && entryId !== "" && nodeMap && !(entryId in nodeMap)) {
    errors.push({ path: "entryId", message: `entryId "${entryId}" is not in nodes` });
  }

  if (nodeMap) {
    for (const [nodeKey, val] of Object.entries(nodeMap)) {
      const refErrors = collectSlotReferenceErrors(nodeMap, val, `nodes.${nodeKey}`, allIds);
      errors.push(...refErrors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateNode(
  schema: GenetikSchema,
  mapKey: string,
  value: unknown,
  path: string
): ContentValidationError | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { path: `${path}.${mapKey}`, message: "Node must be an object" };
  }

  const node = value as Record<string, unknown>;
  const id = node.id;
  const block = node.block;
  const config = node.config;

  if (typeof id !== "string" || id === "") {
    return { path: `${path}.${mapKey}.id`, message: "Node id must be a non-empty string" };
  }
  if (id !== mapKey) {
    return { path: `${path}.${mapKey}.id`, message: `Node id "${id}" must match map key "${mapKey}"` };
  }
  if (typeof block !== "string" || block === "") {
    return { path: `${path}.${mapKey}.block`, message: "Node block must be a non-empty string" };
  }

  const blockType = block ? getBlockType(schema, block as string) : undefined;
  if (!blockType) {
    return {
      path: `${path}.${mapKey}.block`,
      message: `Unknown block type: ${block}`,
    };
  }

  if (config !== undefined && (config === null || typeof config !== "object" || Array.isArray(config))) {
    return { path: `${path}.${mapKey}.config`, message: "Node config must be an object" };
  }

  const configResult = validateConfigAgainstDefinition(blockType, config ?? {});
  if (!configResult.valid && configResult.errors?.length) {
    const first = configResult.errors[0]!;
    return {
      path: `${path}.${mapKey}.config`,
      message: first.message ?? "Invalid config",
    };
  }

  const slotNames = new Set(blockType.slots.map((s) => s.name));
  for (const key of Object.keys(node)) {
    if (key === "id" || key === "block" || key === "config") continue;
    if (!slotNames.has(key)) {
      return {
        path: `${path}.${mapKey}`,
        message: `Unknown slot "${key}" for block type "${block}"`,
      };
    }
    const slotDef = blockType.slots.find((s) => s.name === key);
    if (!slotDef) continue;
    const slotValue = node[key];
    if (slotValue === undefined || slotValue === null) continue;
    if (slotDef.multiple) {
      if (!Array.isArray(slotValue)) {
        return {
          path: `${path}.${mapKey}.${key}`,
          message: `Slot "${key}" must be an array of ids (multiple: true)`,
        };
      }
      if (slotValue.some((v) => typeof v !== "string")) {
        return {
          path: `${path}.${mapKey}.${key}`,
          message: `Slot "${key}" must contain only string ids`,
        };
      }
    } else {
      if (typeof slotValue !== "string") {
        return {
          path: `${path}.${mapKey}.${key}`,
          message: `Slot "${key}" must be a single id string (multiple: false)`,
        };
      }
    }
  }

  return null;
}

function collectSlotReferenceErrors(
  nodeMap: Record<string, unknown>,
  value: unknown,
  path: string,
  allIds: Set<string>
): ContentValidationError[] {
  const errors: ContentValidationError[] = [];
  if (value === null || typeof value !== "object" || Array.isArray(value)) return errors;

  const node = value as ContentNode;
  for (const [key, slotValue] of Object.entries(node)) {
    if (key === "id" || key === "block" || key === "config") continue;
    const ids = Array.isArray(slotValue) ? slotValue : slotValue === undefined || slotValue === null ? [] : [slotValue];
    for (const id of ids) {
      if (typeof id !== "string") continue;
      if (!allIds.has(id)) {
        errors.push({
          path: `${path}.${key}`,
          message: `Referenced id "${id}" is not in nodes (dangling reference)`,
        });
      }
    }
  }
  return errors;
}
