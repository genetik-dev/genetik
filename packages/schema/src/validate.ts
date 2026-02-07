import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import type { BlockTypeDefinition, DecalSchema, JsonSchema } from "./types.js";
import { getBlockType } from "./registry.js";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[] | null;
}

/**
 * Validates a config object against a block type's JSON Schema.
 * Returns { valid: true, errors: null } on success, or { valid: false, errors } on failure.
 */
export function validateConfig(
  schema: DecalSchema,
  blockTypeName: string,
  config: unknown
): ValidationResult {
  const blockType = getBlockType(schema, blockTypeName);
  if (!blockType) {
    return {
      valid: false,
      errors: [
        {
          instancePath: "",
          schemaPath: "",
          keyword: "blockType",
          message: `Unknown block type: ${blockTypeName}`,
          params: {},
        } as ErrorObject,
      ],
    };
  }
  return validateConfigAgainstDefinition(blockType, config);
}

/**
 * Validates a config object against a block type definition's JSON Schema.
 * Use this when you already have the BlockTypeDefinition (e.g. from getBlockType).
 */
export function validateConfigAgainstDefinition(
  blockType: BlockTypeDefinition,
  config: unknown
): ValidationResult {
  const jsonSchema = blockType.configSchema as JsonSchema;
  let validate: (data: unknown) => boolean;
  try {
    validate = ajv.compile(jsonSchema);
  } catch (err) {
    return {
      valid: false,
      errors: [
        {
          instancePath: "",
          schemaPath: "",
          keyword: "schema",
          message: err instanceof Error ? err.message : "Invalid config schema",
          params: {},
        } as ErrorObject,
      ],
    };
  }
  const valid = validate(config);
  return {
    valid,
    errors: valid ? null : (validate.errors ?? []),
  };
}
