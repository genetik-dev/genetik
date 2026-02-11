export type {
  BaseConfigProperty,
  BaseConfigSchema,
  BlockInput,
  BlockInputFromPlugins,
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
  SlotLayoutHint,
  SlotReferenceMode,
} from "./types.js";
export {
  createSchema,
  registerPlugins,
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
