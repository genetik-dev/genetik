import { createSchema } from "@genetik/schema";
import type { BlockInput } from "@genetik/schema";

const textBlock: BlockInput = {
  name: "text",
  configSchema: { type: "object", properties: { content: { type: "string" } } },
  slots: [],
};

const cardBlock: BlockInput = {
  name: "card",
  configSchema: { type: "object", properties: { title: { type: "string" } } },
  slots: [{ name: "children", multiple: true }],
};

export const playgroundSchema = createSchema({
  registerBlocks: [textBlock, cardBlock],
});
