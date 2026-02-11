/**
 * Reference mode for slots (global on schema). How child nodes can be specified.
 * - id: slot value is an id or array of ids (canonical form).
 * - inline: slot may contain inline node(s), normalized to flat + ids before storage/rendering.
 * - both: slot accepts either id(s) or inline node(s).
 */
export type SlotReferenceMode = "id" | "inline" | "both";

/**
 * Optional layout hint for the slot in the editor (e.g. row = flex row, column = flex column).
 * Editor UIs can use this so the slot drop target matches how the block will render.
 */
export type SlotLayoutHint = "row" | "column";

/**
 * Slot definition at runtime: has referenceMode (from schema options).
 */
export interface SlotDefinition {
  /** Slot name (e.g. "children", "header", "footer"). */
  name: string;
  /** If true, slot holds an ordered list of nodes; if false, a single node. */
  multiple: boolean;
  /** From schema options; whether the slot accepts id references, inline nodes, or both. */
  referenceMode: SlotReferenceMode;
  /** Optional: layout hint for editor (e.g. so slot drop target uses flex row/column). */
  layout?: SlotLayoutHint;
  /** Optional: only these block types are allowed in this slot. Mutually exclusive with excludeBlockNames. */
  includeBlockNames?: string[];
  /** Optional: these block types are not allowed in this slot. Mutually exclusive with includeBlockNames. */
  excludeBlockNames?: string[];
}

/**
 * Slot input when registering a block. No referenceMode — that comes from schema options.
 * Only one of includeBlockNames or excludeBlockNames should be provided.
 */
export interface SlotInput {
  /** Slot name (e.g. "children", "header", "footer"). */
  name: string;
  /** If true, slot holds an ordered list of nodes; if false, a single node. */
  multiple: boolean;
  /** Optional: layout hint for editor so slot drop target matches block layout (row | column). */
  layout?: SlotLayoutHint;
  /** Optional: only these block types are allowed in this slot. Mutually exclusive with excludeBlockNames. */
  includeBlockNames?: string[];
  /** Optional: these block types are not allowed in this slot. Mutually exclusive with includeBlockNames. */
  excludeBlockNames?: string[];
}

/**
 * JSON Schema is a plain object. We use a generic object type for flexibility.
 * Block config is validated against this schema (e.g. via ajv).
 */
export type JsonSchema = Record<string, unknown>;

/**
 * Base config property shape: type + optional default (and extra JSON Schema keys).
 * Plugins can extend this (e.g. editor adds editorInput).
 */
export type BaseConfigProperty =
  | { type: "string"; default?: string }
  | { type: "number"; default?: number }
  | { type: "integer"; default?: number }
  | { type: "boolean"; default?: boolean }
  | { type: "object"; default?: Record<string, unknown> }
  | { type: "array"; default?: unknown[] };

/**
 * Base config schema for a block: object type with optional properties map.
 */
export interface BaseConfigSchema {
  type?: "object";
  properties?: Record<string, BaseConfigProperty>;
  [key: string]: unknown;
}

/**
 * Block input when registering. Slots have no referenceMode (global on schema).
 * Optional properties like addable are added by plugins (e.g. editor plugin).
 */
export interface BlockInput {
  /** Block type id (e.g. "hero", "card", "text"). */
  id: string;
  /** Config schema for this block (properties with type/default). */
  configSchema: BaseConfigSchema;
  /** Slots this block exposes. Default [] when omitted. */
  slots?: SlotInput[];
}

/**
 * Runtime block type: slots have referenceMode filled from schema options.
 */
export interface BlockTypeDefinition {
  /** Block type id (e.g. "hero", "card", "text"). */
  id: string;
  /** JSON Schema for this block's config. */
  configSchema: JsonSchema;
  /** Slots with referenceMode applied. */
  slots: SlotDefinition[];
  /** When false, this block cannot be added from the palette or "+ Add block". Default true. */
  addable?: boolean;
}

/**
 * Schema-level options. slotReferenceMode applies to all slots globally.
 */
export interface SchemaOptions {
  /** How slots accept children. Default "id". */
  slotReferenceMode?: SlotReferenceMode;
  [key: string]: unknown;
}

/**
 * Context passed to plugins. Plugins can register blocks and read/mutate options.
 */
export interface SchemaPluginContext {
  /** Register a block type. */
  registerBlock(block: BlockInput): void;
  /** Resolved options (includes slotReferenceMode). Mutate to add plugin options. */
  options: SchemaOptions;
  /** Schema version if set. */
  version?: string;
}

/**
 * Build-time plugin. Can register blocks and/or add options.
 * When generic T is provided, the plugin extends the block type (e.g. EditorBlockInput);
 * createSchema infers the intersection of all plugins' T for blocks.
 */
export type SchemaPlugin<TBlockInput extends BlockInput = BlockInput> = ((
  context: SchemaPluginContext,
) => void) & { readonly __blockInput?: TBlockInput };

/**
 * Infers the block input type from a tuple of plugins (intersection of all plugin extensions).
 */
export type BlockInputFromPlugins<P extends readonly unknown[]> =
  P extends readonly [SchemaPlugin<infer T>, ...infer R]
    ? T & BlockInputFromPlugins<R>
    : BlockInput;

/**
 * Config for createSchema. When P is a tuple of plugins, blocks is typed as
 * the intersection of all plugins' block input types.
 */
export interface SchemaConfig<
  P extends readonly SchemaPlugin[] = readonly SchemaPlugin[],
> {
  /** Block types to register. Typed from plugins when P is provided. */
  blocks?: BlockInputFromPlugins<P>[];
  /** Plugins run in order; each can register blocks and add options. */
  plugins?: P;
  /** Schema version (e.g. "1.0.0"). */
  version?: string;
  /** Schema options (e.g. slotReferenceMode). Merged with plugin-added options. */
  options?: SchemaOptions;
}

/**
 * Schema metadata: version for migrations and compatibility.
 */
export interface SchemaMeta {
  /** Schema version (e.g. "1.0.0"). */
  version: string;
}

/**
 * Runtime schema: block types + meta. createSchema also adds contentSchema and getters.
 */
export interface GenetikSchema {
  /** Map of block type name to definition. */
  blockTypes: Map<string, BlockTypeDefinition>;
  /** Optional schema metadata (e.g. version). */
  meta?: SchemaMeta;
}
