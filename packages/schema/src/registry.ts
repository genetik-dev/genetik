import type {
  BlockInput,
  BlockTypeDefinition,
  GenetikSchema,
  JsonSchema,
  SchemaConfig,
  SchemaOptions,
  SlotDefinition,
  SlotReferenceMode,
} from "./types.js";

const DEFAULT_REFERENCE_MODE: SlotReferenceMode = "id";

function resolveOptions(configOptions?: SchemaOptions): SchemaOptions {
  return {
    slotReferenceMode: DEFAULT_REFERENCE_MODE,
    ...configOptions,
  };
}

function toSlotDefinition(
  slot: {
    name: string;
    multiple: boolean;
    layout?: import("./types.js").SlotLayoutHint;
    includeBlockNames?: string[];
    excludeBlockNames?: string[];
  },
  referenceMode: SlotReferenceMode
): SlotDefinition {
  return {
    name: slot.name,
    multiple: slot.multiple,
    referenceMode,
    ...(slot.layout !== undefined && { layout: slot.layout }),
    // Only one of include/exclude: prefer include when both are set
    ...(slot.includeBlockNames !== undefined && { includeBlockNames: slot.includeBlockNames }),
    ...(slot.excludeBlockNames !== undefined &&
      slot.includeBlockNames === undefined && { excludeBlockNames: slot.excludeBlockNames }),
  };
}

function toBlockTypeDefinition(block: BlockInput, referenceMode: SlotReferenceMode): BlockTypeDefinition {
  return {
    name: block.name,
    configSchema: block.configSchema,
    slots: block.slots.map((s) => toSlotDefinition(s, referenceMode)),
    ...(block.addable === false && { addable: false }),
  };
}

function buildContentSchema(blockNames: string[]): JsonSchema {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    required: ["entryId", "nodes"],
    properties: {
      entryId: { type: "string" },
      nodes: {
        type: "object",
        additionalProperties: { $ref: "#/definitions/ContentNode" },
      },
    },
    definitions: {
      ContentNode: {
        type: "object",
        required: ["id", "block", "config"],
        properties: {
          id: { type: "string" },
          block: blockNames.length > 0 ? { type: "string", enum: blockNames } : { type: "string" },
          config: { type: "object" },
        },
        additionalProperties: true,
      },
    },
  };
}

export interface SchemaInstance extends GenetikSchema {
  /** JSON Schema that describes the content document (entryId + nodes). */
  contentSchema: JsonSchema;
  /** Resolved options (includes slotReferenceMode). */
  options: SchemaOptions;
  /** Schema version if set. */
  version?: string;
  getBlockType(name: string): BlockTypeDefinition | undefined;
  getBlockTypeNames(): string[];
  hasBlockType(name: string): boolean;
}

/**
 * Creates a schema from config. Runs plugins (which can register blocks and add options),
 * then builds block types with global slotReferenceMode. Returns the schema with getters
 * and a contentSchema (JSON Schema for the content document).
 */
export function createSchema(config: SchemaConfig): SchemaInstance {
  const blocks: BlockInput[] = [...(config.registerBlocks ?? [])];
  const options = resolveOptions(config.options);

  const context: import("./types.js").SchemaPluginContext = {
    registerBlock(block: BlockInput) {
      blocks.push(block);
    },
    options,
    version: config.version,
  };

  for (const plugin of config.registerPlugins ?? []) {
    plugin(context);
  }

  const referenceMode = (options.slotReferenceMode ?? DEFAULT_REFERENCE_MODE) as SlotReferenceMode;
  const blockTypes = new Map<string, BlockTypeDefinition>();
  for (const block of blocks) {
    blockTypes.set(block.name, toBlockTypeDefinition(block, referenceMode));
  }

  const blockNames = Array.from(blockTypes.keys());
  const contentSchema = buildContentSchema(blockNames);

  const schema: GenetikSchema = {
    blockTypes,
    meta: config.version !== undefined ? { version: config.version } : undefined,
  };

  return {
    ...schema,
    contentSchema,
    options,
    version: config.version,
    getBlockType(name: string) {
      return blockTypes.get(name);
    },
    getBlockTypeNames() {
      return Array.from(blockTypes.keys());
    },
    hasBlockType(name: string) {
      return blockTypes.has(name);
    },
  };
}

/**
 * Returns the block type definition for the given name, or undefined if not registered.
 */
export function getBlockType(schema: GenetikSchema, name: string): BlockTypeDefinition | undefined {
  return schema.blockTypes.get(name);
}

/**
 * Returns true if the schema has a block type with the given name.
 */
export function hasBlockType(schema: GenetikSchema, name: string): boolean {
  return schema.blockTypes.has(name);
}

/**
 * Returns all registered block type names.
 */
export function getBlockTypeNames(schema: GenetikSchema): string[] {
  return Array.from(schema.blockTypes.keys());
}
