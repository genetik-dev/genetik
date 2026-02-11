import type {
  BaseConfigProperty,
  BaseConfigSchema,
  BlockInput,
  SchemaPlugin,
  SchemaPluginContext,
} from "@genetik/schema";

/**
 * Editor-specific config property: base shape plus optional editorInput for the config form.
 */
export type EditorConfigProperty = BaseConfigProperty & {
  editorInput?: "text" | "textarea" | "number" | "checkbox";
};

/**
 * Config schema for blocks used with the editor: properties may include editorInput.
 */
export interface EditorConfigSchema extends BaseConfigSchema {
  properties?: Record<string, EditorConfigProperty>;
}

/**
 * Block input type when using the editor plugin. configSchema.properties may include
 * editorInput so the editor side panel renders the right form field. addable controls
 * whether the block can be added from the palette or "+ Add block" (e.g. root-only blocks).
 */
export interface EditorBlockInput extends BlockInput {
  configSchema: EditorConfigSchema;
  /** When false, this block cannot be added from the palette or "+ Add block". Default true. */
  addable?: boolean;
}

/**
 * Schema plugin that extends block types with editor fields (e.g. editorInput on config properties).
 * Pass to createSchema plugins so blocks is typed as EditorBlockInput[].
 */
export const editorSchemaPlugin: SchemaPlugin<EditorBlockInput> = (
  ctx: SchemaPluginContext
): void => {
  void ctx; // No-op at runtime; the plugin carries the EditorBlockInput type for createSchema inference.
};
