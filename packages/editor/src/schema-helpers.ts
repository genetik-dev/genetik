import type { GenetikSchema } from "@genetik/schema";
import { getBlockType, getBlockTypeNames } from "@genetik/schema";

/**
 * Returns all block type names registered in the schema (allowed for palette / add-block).
 */
export function getAllowedBlockTypes(schema: GenetikSchema): string[] {
  return getBlockTypeNames(schema);
}

/**
 * Returns default config for a new block of the given type.
 * Reads "default" (JSON Schema) or "defaultValue" from each property in configSchema.properties.
 */
export function getDefaultConfig(
  schema: GenetikSchema,
  blockType: string
): Record<string, unknown> {
  const definition = getBlockType(schema, blockType);
  if (!definition?.configSchema || typeof definition.configSchema !== "object") {
    return {};
  }
  const configSchema = definition.configSchema as { properties?: Record<string, Record<string, unknown>> };
  const properties = configSchema.properties;
  if (!properties || typeof properties !== "object") {
    return {};
  }
  const config: Record<string, unknown> = {};
  for (const [key, propSchema] of Object.entries(properties)) {
    if (propSchema && typeof propSchema === "object" && ("default" in propSchema || "defaultValue" in propSchema)) {
      const value = (propSchema as { default?: unknown; defaultValue?: unknown }).default ??
        (propSchema as { default?: unknown; defaultValue?: unknown }).defaultValue;
      config[key] = value;
    }
  }
  return config;
}
