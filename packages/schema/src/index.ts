export type {
  BaseConfigProperty,
  BaseConfigSchema,
  BlockInput,
  BlockInputFromPlugins,
  BlockTypeDefinition,
  GenetikSchema,
  JsonSchema,
  PageContextProperty,
  PageContextSchema,
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
  contextPlugin,
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
