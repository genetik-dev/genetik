import { createSchema } from "@genetik/schema";
import type { BlockInput } from "@genetik/schema";

const textBlock: BlockInput = {
  name: "text",
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
};

const cardBlock: BlockInput = {
  name: "card",
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
  slots: [{ name: "children", multiple: false }],
};

const rowBlock: BlockInput = {
  name: "row",
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
};

const columnBlock: BlockInput = {
  name: "column",
  configSchema: { type: "object" },
  slots: [{ name: "children", multiple: true, layout: "column" }],
};

const imageBlock: BlockInput = {
  name: "image",
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
  slots: [],
};

/** Root-only block: not addable from palette or "+ Add block". Only rows as direct children. */
const pageBlock: BlockInput = {
  name: "page",
  configSchema: { type: "object" },
  slots: [{ name: "children", multiple: true, includeBlockNames: ["row"] }],
  addable: false,
};

export const playgroundSchema = createSchema({
  registerBlocks: [
    textBlock,
    cardBlock,
    rowBlock,
    columnBlock,
    imageBlock,
    pageBlock,
  ],
});
