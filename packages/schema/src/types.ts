/**
 * Reference mode for a slot: how child nodes can be specified.
 * - id: slot value is an id or array of ids (canonical form).
 * - inline: slot may contain inline node(s), normalized to flat + ids before storage/rendering.
 * - both: slot accepts either id(s) or inline node(s).
 */
export type SlotReferenceMode = "id" | "inline" | "both";

/**
 * Defines a slot on a block type: name, cardinality, and reference mode.
 */
export interface SlotDefinition {
  /** Slot name (e.g. "children", "header", "footer"). */
  name: string;
  /** If true, slot holds an ordered list of nodes; if false, a single node. */
  multiple: boolean;
  /** Whether the slot accepts id references, inline nodes, or both. */
  referenceMode: SlotReferenceMode;
}

/**
 * JSON Schema is a plain object. We use a generic object type for flexibility.
 * Block config is validated against this schema (e.g. via ajv).
 */
export type JsonSchema = Record<string, unknown>;

/**
 * Defines a block type: name, config schema (JSON Schema), and slots.
 */
export interface BlockTypeDefinition {
  /** Block type name (e.g. "hero", "card", "text"). */
  name: string;
  /** JSON Schema for this block's config. */
  configSchema: JsonSchema;
  /** Slots this block exposes. */
  slots: SlotDefinition[];
}

/**
 * Schema metadata: version for migrations and compatibility.
 */
export interface SchemaMeta {
  /** Schema version (e.g. "1.0.0"). */
  version: string;
}

/**
 * Runtime schema: block types registered in a registry, plus optional metadata.
 */
export interface GenetikSchema {
  /** Map of block type name to definition. */
  blockTypes: Map<string, BlockTypeDefinition>;
  /** Optional schema metadata (e.g. version). */
  meta?: SchemaMeta;
}
