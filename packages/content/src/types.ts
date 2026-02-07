/**
 * Canonical content model: flat node map and entry point.
 * Slot values are id references (string or array of ids).
 */

/**
 * A single node in the content tree. In canonical form, slot values
 * are string (id) or string[] (ordered ids). Keys besides id, block,
 * and config are slot names defined by the block type.
 */
export interface ContentNode {
  /** Node id; must match the key in the nodes map. */
  id: string;
  /** Block type name (must exist in schema). */
  block: string;
  /** Block-specific configuration (validated against block's JSON Schema). */
  config: Record<string, unknown>;
  /** Slot name → id or array of ids. Other keys are not allowed in canonical form. */
  [slotName: string]: unknown;
}

/**
 * Slot value in canonical form: either a single node id or an ordered list of ids.
 */
export type SlotValue = string | string[];

/**
 * Content definition in canonical form: one entry id and a flat map of nodes.
 * No nesting; slots reference children by id.
 */
export interface GenetikContent {
  /** Root node id (must exist in nodes). */
  entryId: string;
  /** Flat map of node id → node. */
  nodes: Record<string, ContentNode>;
}

/**
 * Input form for a slot value when the schema allows inline (referenceMode "inline" or "both").
 * Can be an id, array of ids, a single inline node object, or array of id or inline node.
 */
export type InlineSlotValue = string | string[] | InlineNode | (string | InlineNode)[];

/**
 * Inline node: can appear in a slot when schema allows. Has block, config, optional id,
 * and slot keys whose values may be id(s) or nested inline. Normalization flattens these
 * and assigns ids.
 */
export interface InlineNode {
  /** Optional; if missing, normalization will generate one. */
  id?: string;
  block: string;
  config: Record<string, unknown>;
  [slotName: string]: unknown;
}

/**
 * Content in input form: same shape as canonical but slot values may be inline (when schema allows).
 * Used as input to normalizeContent().
 */
export interface GenetikContentInput {
  entryId: string;
  nodes: Record<string, ContentNodeInput>;
}

/**
 * Node in input form: id must match map key; slot values may be id, id[], or inline (per schema).
 */
export interface ContentNodeInput {
  id: string;
  block: string;
  config: Record<string, unknown>;
  [slotName: string]: unknown;
}
