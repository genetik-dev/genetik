import { describe, it, expect } from "vitest";
import {
  createSchema,
  getBlockType,
  hasBlockType,
  getBlockTypeNames,
} from "./registry.js";
import type { BlockInput } from "./types.js";

const textBlock: BlockInput = {
  name: "text",
  configSchema: {
    type: "object",
    properties: { content: { type: "string" } },
    required: ["content"],
  },
  slots: [],
};

const cardBlock: BlockInput = {
  name: "card",
  configSchema: { type: "object", properties: { title: { type: "string" } } },
  slots: [
    { name: "children", multiple: true },
    { name: "footer", multiple: false },
  ],
};

describe("createSchema", () => {
  it("returns a schema with block types from registerBlocks", () => {
    const schema = createSchema({ registerBlocks: [textBlock, cardBlock] });
    expect(schema.blockTypes.size).toBe(2);
    expect(getBlockType(schema, "text")?.name).toBe("text");
    expect(getBlockType(schema, "text")?.configSchema).toEqual(textBlock.configSchema);
    expect(getBlockType(schema, "text")?.slots).toEqual([]);
    const card = getBlockType(schema, "card");
    expect(card?.name).toBe("card");
    expect(card?.slots).toHaveLength(2);
    expect(card?.slots[0]).toEqual({ name: "children", multiple: true, referenceMode: "id" });
    expect(card?.slots[1]).toEqual({ name: "footer", multiple: false, referenceMode: "id" });
  });

  it("applies global slotReferenceMode from options", () => {
    const schema = createSchema({
      registerBlocks: [cardBlock],
      options: { slotReferenceMode: "both" },
    });
    const card = getBlockType(schema, "card");
    expect(card).toBeDefined();
    expect(card!.slots[0]!.referenceMode).toBe("both");
    expect(card!.slots[1]!.referenceMode).toBe("both");
  });

  it("returns contentSchema (JSON Schema for content)", () => {
    const schema = createSchema({ registerBlocks: [textBlock] });
    expect(schema.contentSchema).toBeDefined();
    expect(schema.contentSchema.type).toBe("object");
    expect(schema.contentSchema.required).toEqual(["entryId", "nodes"]);
    const definitions = (schema.contentSchema as { definitions?: { ContentNode?: unknown } }).definitions;
    expect(definitions?.ContentNode).toBeDefined();
    expect((definitions?.ContentNode as { properties?: { block?: { enum?: string[] } } }).properties?.block?.enum).toContain("text");
  });

  it("exposes getters and options", () => {
    const schema = createSchema({
      registerBlocks: [textBlock],
      version: "1.0.0",
      options: { slotReferenceMode: "inline" },
    });
    expect(schema.getBlockType("text")).toBeDefined();
    expect(schema.getBlockTypeNames()).toEqual(["text"]);
    expect(schema.hasBlockType("text")).toBe(true);
    expect(schema.options.slotReferenceMode).toBe("inline");
    expect(schema.version).toBe("1.0.0");
  });

  it("runs plugins which can register blocks", () => {
    const schema = createSchema({
      registerBlocks: [textBlock],
      registerPlugins: [
        (ctx) => {
          ctx.registerBlock(cardBlock);
        },
      ],
    });
    expect(schema.blockTypes.size).toBe(2);
    expect(getBlockType(schema, "card")).toBeDefined();
  });

  it("accepts optional version in meta", () => {
    const schema = createSchema({ version: "1.0.0", registerBlocks: [textBlock] });
    expect(schema.meta?.version).toBe("1.0.0");
  });

  it("accepts empty registerBlocks", () => {
    const schema = createSchema({ registerBlocks: [] });
    expect(schema.blockTypes.size).toBe(0);
    expect(schema.meta).toBeUndefined();
  });
});

describe("getBlockType", () => {
  it("returns block type by name", () => {
    const schema = createSchema({ registerBlocks: [textBlock, cardBlock] });
    expect(getBlockType(schema, "text")?.name).toBe("text");
    expect(getBlockType(schema, "card")?.name).toBe("card");
  });

  it("returns undefined for unknown block type", () => {
    const schema = createSchema({ registerBlocks: [textBlock] });
    expect(getBlockType(schema, "unknown")).toBeUndefined();
  });
});

describe("hasBlockType", () => {
  it("returns true for registered block type", () => {
    const schema = createSchema({ registerBlocks: [textBlock] });
    expect(hasBlockType(schema, "text")).toBe(true);
  });

  it("returns false for unregistered block type", () => {
    const schema = createSchema({ registerBlocks: [] });
    expect(hasBlockType(schema, "text")).toBe(false);
  });
});

describe("getBlockTypeNames", () => {
  it("returns empty array when no block types", () => {
    const schema = createSchema({ registerBlocks: [] });
    expect(getBlockTypeNames(schema)).toEqual([]);
  });

  it("returns all block type names", () => {
    const schema = createSchema({ registerBlocks: [textBlock, cardBlock] });
    const names = getBlockTypeNames(schema);
    expect(names).toHaveLength(2);
    expect(names).toContain("text");
    expect(names).toContain("card");
  });
});
