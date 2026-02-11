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
  slots: [{ name: "children", multiple: true }],
};

export const playgroundSchema = createSchema({
  registerBlocks: [textBlock, cardBlock],
});
