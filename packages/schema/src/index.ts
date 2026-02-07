export type {
  BlockTypeDefinition,
  GenetikSchema,
  JsonSchema,
  SchemaMeta,
  SlotDefinition,
  SlotReferenceMode,
} from "./types.js";
export { createSchema, getBlockType, getBlockTypeNames, hasBlockType, registerBlockType } from "./registry.js";
export {
  validateConfig,
  validateConfigAgainstDefinition,
  type ValidationResult,
} from "./validate.js";
