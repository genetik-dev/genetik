import type { GenetikSchema, SlotDefinition } from "@genetik/schema";
import { getBlockType, getBlockTypeNames } from "@genetik/schema";

/**
 * Returns all block type names registered in the schema.
 */
export function getAllowedBlockTypes(schema: GenetikSchema): string[] {
  return getBlockTypeNames(schema);
}

/**
 * Returns block type names that can be added from the palette or "+ Add block".
 * Excludes block types with addable: false (e.g. root-only blocks like "page").
 */
export function getAddableBlockTypes(schema: GenetikSchema): string[] {
  return getBlockTypeNames(schema).filter((name) => {
    const def = getBlockType(schema, name);
    return def?.addable !== false;
  });
}

/**
 * Returns block type names allowed in the given slot.
 * If the slot has includeBlockNames, returns the intersection with schema block types.
 * If the slot has excludeBlockNames, returns all schema block types except those.
 * Otherwise returns all schema block types.
 */
export function getSlotAllowedBlockTypes(
  schema: GenetikSchema,
  slotDef: SlotDefinition
): string[] {
  const all = getBlockTypeNames(schema);
  if (slotDef.includeBlockNames !== undefined && slotDef.includeBlockNames.length > 0) {
    return slotDef.includeBlockNames.filter((name) => all.includes(name));
  }
  if (slotDef.excludeBlockNames !== undefined && slotDef.excludeBlockNames.length > 0) {
    return all.filter((name) => !slotDef.excludeBlockNames!.includes(name));
  }
  return all;
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
