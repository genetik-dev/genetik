import { createSchema, registerPlugins } from "@genetik/schema";
import { editorSchemaPlugin } from "@genetik/editor";

const { plugins, defineBlock } = registerPlugins([editorSchemaPlugin] as const);

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

/** Root-only block: not addable from palette or "+ Add block". Only rows as direct children. */
const pageBlock = defineBlock({
  id: "page",
  configSchema: { type: "object" },
  slots: [{ name: "children", multiple: true, includeBlockNames: ["row"] }],
  addable: false,
});

export const playgroundSchema = createSchema({
  blocks: [textBlock, cardBlock, rowBlock, columnBlock, imageBlock, pageBlock],
  plugins,
});
