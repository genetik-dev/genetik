import AjvDefault from "ajv";
import addFormatsDefault from "ajv-formats";
import type { ErrorObject, ValidateFunction } from "ajv";
import type { BlockTypeDefinition, GenetikSchema } from "./types.js";
import { getBlockType } from "./registry.js";

// ESM/NodeNext: default export types don't expose constructor/call; assert through unknown
const Ajv = AjvDefault as unknown as new (opts?: { allErrors?: boolean; strict?: boolean }) => { compile: (schema: object) => ValidateFunction };
const addFormats = addFormatsDefault as unknown as (ajv: InstanceType<typeof Ajv>) => void;
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
  schema: GenetikSchema,
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
        } satisfies ErrorObject,
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
  let validate: ValidateFunction;
  try {
    validate = ajv.compile(blockType.configSchema);
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
        } satisfies ErrorObject,
      ],
    };
  }
  const valid = validate(config);
  return {
    valid,
    errors: valid ? null : (validate.errors ?? []),
  };
}
