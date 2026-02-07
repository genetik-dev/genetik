import type { BlockTypeDefinition, DecalSchema, SchemaMeta } from "./types.js";

/**
 * Creates an empty schema. Use the returned object to register block types.
 */
export function createSchema(meta?: SchemaMeta): DecalSchema {
  return {
    blockTypes: new Map(),
    meta,
  };
}

/**
 * Registers a block type on the schema. Overwrites if the name already exists.
 */
export function registerBlockType(
  schema: DecalSchema,
  blockType: BlockTypeDefinition
): void {
  schema.blockTypes.set(blockType.name, blockType);
}

/**
 * Returns the block type definition for the given name, or undefined if not registered.
 */
export function getBlockType(
  schema: DecalSchema,
  name: string
): BlockTypeDefinition | undefined {
  return schema.blockTypes.get(name);
}

/**
 * Returns true if the schema has a block type with the given name.
 */
export function hasBlockType(schema: DecalSchema, name: string): boolean {
  return schema.blockTypes.has(name);
}

/**
 * Returns all registered block type names.
 */
export function getBlockTypeNames(schema: DecalSchema): string[] {
  return Array.from(schema.blockTypes.keys());
}
