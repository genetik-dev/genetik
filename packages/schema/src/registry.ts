import type {
  BlockInput,
  BlockInputFromPlugins,
  BlockTypeDefinition,
  GenetikSchema,
  JsonSchema,
  SchemaOptions,
  SchemaPlugin,
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

function toBlockTypeDefinition(
  block: BlockInput & { addable?: boolean },
  referenceMode: SlotReferenceMode
): BlockTypeDefinition {
  return {
    id: block.id,
    configSchema: block.configSchema,
    slots: (block.slots ?? []).map((s) => toSlotDefinition(s, referenceMode)),
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
  getBlockType(id: string): BlockTypeDefinition | undefined;
  getBlockTypeNames(): string[];
  hasBlockType(id: string): boolean;
}

/**
 * Returns the plugin tuple and a function that type-checks a block against the
 * intersection of all plugin block types. Use with createSchema so blocks are
 * typed from plugins (no need to import EditorBlockInput etc.). Example:
 *   const { plugins, defineBlock } = registerPlugins([editorSchemaPlugin] as const);
 *   const textBlock = defineBlock({ id: "text", configSchema: { ... }, slots: [] });
 *   createSchema({ blocks: [textBlock], plugins });
 */
export function registerPlugins<P extends readonly SchemaPlugin[]>(plugins: P): {
  plugins: P;
  defineBlock: (block: BlockInputFromPlugins<P>) => BlockInputFromPlugins<P>;
} {
  return {
    plugins,
    defineBlock: (block) => block as BlockInputFromPlugins<P>,
  };
}

/**
 * Creates a schema from config. Runs plugins (which can register blocks and add options),
 * then builds block types with global slotReferenceMode. Returns the schema with getters
 * and a contentSchema (JSON Schema for the content document).
 * When plugins is a tuple of SchemaPlugin<T>, blocks is typed as the
 * intersection of all T (e.g. use editorSchemaPlugin from @genetik/editor for editorInput).
 */
export function createSchema<P extends readonly import("./types.js").SchemaPlugin[]>(
  config: import("./types.js").SchemaConfig<P>
): SchemaInstance {
  const blocks: BlockInput[] = [...(config.blocks ?? [])];
  const options = resolveOptions(config.options);

  const context: import("./types.js").SchemaPluginContext = {
    registerBlock(block: BlockInput) {
      blocks.push(block);
    },
    options,
    version: config.version,
  };

  for (const plugin of config.plugins ?? []) {
    plugin(context);
  }

  const referenceMode = (options.slotReferenceMode ?? DEFAULT_REFERENCE_MODE) as SlotReferenceMode;
  const blockTypes = new Map<string, BlockTypeDefinition>();
  for (const block of blocks) {
    blockTypes.set(block.id, toBlockTypeDefinition(block, referenceMode));
  }

  const blockIds = Array.from(blockTypes.keys());
  const contentSchema = buildContentSchema(blockIds);

  const schema: GenetikSchema = {
    blockTypes,
    meta: config.version !== undefined ? { version: config.version } : undefined,
  };

  return {
    ...schema,
    contentSchema,
    options,
    version: config.version,
    getBlockType(id: string) {
      return blockTypes.get(id);
    },
    getBlockTypeNames() {
      return Array.from(blockTypes.keys());
    },
    hasBlockType(id: string) {
      return blockTypes.has(id);
    },
  };
}

/**
 * Returns the block type definition for the given id, or undefined if not registered.
 */
export function getBlockType(schema: GenetikSchema, id: string): BlockTypeDefinition | undefined {
  return schema.blockTypes.get(id);
}

/**
 * Returns true if the schema has a block type with the given id.
 */
export function hasBlockType(schema: GenetikSchema, id: string): boolean {
  return schema.blockTypes.has(id);
}

/**
 * Returns all registered block type names.
 */
export function getBlockTypeNames(schema: GenetikSchema): string[] {
  return Array.from(schema.blockTypes.keys());
}
