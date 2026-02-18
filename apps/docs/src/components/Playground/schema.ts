import { createSchema, registerPlugins, contextPlugin } from "@genetik/schema";
import { editorSchemaPlugin } from "@genetik/editor";

/** Page context schema: keys with type/default/editorInput. Blocks declare availableContexts to listen to these. */
const contextSchema = {
  type: "object" as const,
  properties: {
    customContextBoolean: {
      type: "boolean" as const,
      default: false,
      editorInput: "checkbox" as const,
    },
    theme: {
      type: "string" as const,
      default: "light",
      editorInput: "text" as const,
    },
    role: {
      type: "string" as const,
      default: "viewer",
      editorInput: "text" as const,
    },
  },
};

const { plugins, defineBlock } = registerPlugins([
  editorSchemaPlugin,
  contextPlugin(contextSchema),
] as const);

const textBlock = defineBlock({
  id: "text",
  configSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        default:
          "lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.",
        editorInput: "textarea",
      },
    },
  },
  slots: [],
  availableContexts: ["theme", "role", "customContextBoolean"],
});

const cardBlock = defineBlock({
  id: "card",
  configSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        default: "hello world",
        editorInput: "text",
      },
    },
  },
  slots: [
    {
      name: "children",
      multiple: false,
      excludeBlockNames: ["card", "column"],
    },
  ],
  availableContexts: ["theme", "role", "customContextBoolean"],
});

const rowBlock = defineBlock({
  id: "row",
  configSchema: {
    type: "object",
    properties: {
      gap: {
        type: "string",
        default: "normal",
        editorInput: "text",
      },
    },
  },
  slots: [
    {
      name: "children",
      multiple: true,
      layout: "row",
      includeBlockNames: ["column"],
    },
  ],
});

const columnBlock = defineBlock({
  id: "column",
  configSchema: { type: "object" },
  slots: [
    {
      name: "children",
      multiple: true,
      layout: "column",
      excludeBlockNames: ["column"],
    },
  ],
});

const imageBlock = defineBlock({
  id: "image",
  configSchema: {
    type: "object",
    properties: {
      src: {
        type: "string",
        default: "https://placehold.co/600x300?text=Image",
        editorInput: "text",
      },
      alt: {
        type: "string",
        default: "",
        editorInput: "text",
      },
      caption: {
        type: "string",
        default: "",
        editorInput: "text",
      },
    },
  },
});

/** Button: toggles a boolean in page context. Config sets which context key to toggle. */
const buttonBlock = defineBlock({
  id: "button",
  configSchema: {
    type: "object",
    properties: {
      contextPath: {
        type: "string",
        default: "customContextBoolean",
        editorInput: "text",
      },
      label: {
        type: "string",
        default: "Toggle",
        editorInput: "text",
      },
    },
  },
  slots: [],
  availableContexts: ["customContextBoolean"],
});

/** Root-only block: not addable from palette or "+ Add block". Only rows as direct children. */
const pageBlock = defineBlock({
  id: "page",
  configSchema: { type: "object" },
  slots: [{ name: "children", multiple: true, includeBlockNames: ["row"] }],
  addable: false,
});

export const playgroundSchema = createSchema({
  blocks: [
    textBlock,
    cardBlock,
    rowBlock,
    columnBlock,
    imageBlock,
    buttonBlock,
    pageBlock,
  ],
  plugins,
});
