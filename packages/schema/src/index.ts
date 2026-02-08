export type {
  BlockInput,
  BlockTypeDefinition,
  GenetikSchema,
  JsonSchema,
  SchemaConfig,
  SchemaMeta,
  SchemaOptions,
  SchemaPlugin,
  SchemaPluginContext,
  SlotDefinition,
  SlotInput,
  SlotReferenceMode,
} from "./types.js";
export {
  createSchema,
  getBlockType,
  getBlockTypeNames,
  hasBlockType,
} from "./registry.js";
export type { SchemaInstance } from "./registry.js";
export {
  validateConfig,
  validateConfigAgainstDefinition,
  type ValidationResult,
} from "./validate.js";
