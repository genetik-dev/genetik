import { describe, it, expect } from "vitest";
import {
  createSchema,
  getBlockType,
  hasBlockType,
  getBlockTypeNames,
  registerPlugins,
} from "./registry.js";
import type { BlockInput, SchemaPlugin } from "./types.js";

const textBlock: BlockInput = {
  id: "text",
  configSchema: {
    type: "object",
    properties: { content: { type: "string" } },
    required: ["content"],
  },
  slots: [],
};

const cardBlock: BlockInput = {
  id: "card",
  configSchema: { type: "object", properties: { title: { type: "string" } } },
  slots: [
    { name: "children", multiple: true },
    { name: "footer", multiple: false },
  ],
};

describe("registerPlugins", () => {
  it("returns plugins and defineBlock; defineBlock returns the same block (identity at runtime)", () => {
    const { plugins, defineBlock } = registerPlugins([]);
    expect(plugins).toEqual([]);
    const block = defineBlock(textBlock);
    expect(block).toBe(textBlock);
    expect(block).toEqual(textBlock);
  });
});

describe("createSchema", () => {
  it("returns a schema with block types from blocks", () => {
    const schema = createSchema({ blocks: [textBlock, cardBlock] });
    expect(schema.blockTypes.size).toBe(2);
    expect(getBlockType(schema, "text")?.id).toBe("text");
    expect(getBlockType(schema, "text")?.configSchema).toEqual(textBlock.configSchema);
    expect(getBlockType(schema, "text")?.slots).toEqual([]);
    const card = getBlockType(schema, "card");
    expect(card?.id).toBe("card");
    expect(card?.slots).toHaveLength(2);
    expect(card?.slots[0]).toEqual({ name: "children", multiple: true, referenceMode: "id" });
    expect(card?.slots[1]).toEqual({ name: "footer", multiple: false, referenceMode: "id" });
  });

  it("passes through optional slot layout hint", () => {
    const schema = createSchema({
      blocks: [
        {
          id: "row",
          configSchema: { type: "object" },
          slots: [{ name: "children", multiple: true, layout: "row" }],
        },
      ],
    });
    const row = getBlockType(schema, "row");
    expect(row?.slots[0]).toEqual({ name: "children", multiple: true, referenceMode: "id", layout: "row" });
  });

  it("passes through includeBlockNames and excludeBlockNames (prefer include when both set)", () => {
    const schema = createSchema({
      blocks: [
        {
          id: "b",
          configSchema: { type: "object" },
          slots: [
            { name: "only", multiple: true, includeBlockNames: ["text", "card"] },
            { name: "noImage", multiple: true, excludeBlockNames: ["image"] },
            {
              name: "both",
              multiple: true,
              includeBlockNames: ["text"],
              excludeBlockNames: ["card"],
            },
          ],
        },
      ],
    });
    const b = getBlockType(schema, "b");
    expect(b?.slots[0]).toMatchObject({ includeBlockNames: ["text", "card"] });
    expect(b?.slots[1]).toMatchObject({ excludeBlockNames: ["image"] });
    expect(b?.slots[2]).toMatchObject({ includeBlockNames: ["text"] });
    expect(b?.slots[2]).not.toHaveProperty("excludeBlockNames");
  });

  it("passes through addable: false for root-only blocks", () => {
    // addable is provided by plugins (e.g. editor); use a minimal plugin so the test type-checks
    const addablePlugin: SchemaPlugin<BlockInput & { addable?: boolean }> = () => {};
    const schema = createSchema({
      blocks: [
        { id: "text", configSchema: { type: "object" }, slots: [] },
        { id: "page", configSchema: { type: "object" }, slots: [{ name: "children", multiple: true }], addable: false },
      ],
      plugins: [addablePlugin] as const,
    });
    expect(getBlockType(schema, "text")?.addable).toBeUndefined();
    expect(getBlockType(schema, "page")?.addable).toBe(false);
  });

  it("applies global slotReferenceMode from options", () => {
    const schema = createSchema({
      blocks: [cardBlock],
      options: { slotReferenceMode: "both" },
    });
    const card = getBlockType(schema, "card");
    expect(card).toBeDefined();
    expect(card!.slots[0]!.referenceMode).toBe("both");
    expect(card!.slots[1]!.referenceMode).toBe("both");
  });

  it("returns contentSchema (JSON Schema for content)", () => {
    const schema = createSchema({ blocks: [textBlock] });
    expect(schema.contentSchema).toBeDefined();
    expect(schema.contentSchema.type).toBe("object");
    expect(schema.contentSchema.required).toEqual(["entryId", "nodes"]);
    const definitions = (schema.contentSchema as { definitions?: { ContentNode?: unknown } }).definitions;
    expect(definitions?.ContentNode).toBeDefined();
    expect((definitions?.ContentNode as { properties?: { block?: { enum?: string[] } } }).properties?.block?.enum).toContain("text");
  });

  it("exposes getters and options", () => {
    const schema = createSchema({
      blocks: [textBlock],
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
      blocks: [textBlock],
      plugins: [
        (ctx) => {
          ctx.registerBlock(cardBlock);
        },
      ],
    });
    expect(schema.blockTypes.size).toBe(2);
    expect(getBlockType(schema, "card")).toBeDefined();
  });

  it("accepts optional version in meta", () => {
    const schema = createSchema({ version: "1.0.0", blocks: [textBlock] });
    expect(schema.meta?.version).toBe("1.0.0");
  });

  it("accepts empty blocks", () => {
    const schema = createSchema({ blocks: [] });
    expect(schema.blockTypes.size).toBe(0);
    expect(schema.meta).toBeUndefined();
  });
});

describe("getBlockType", () => {
  it("returns block type by id", () => {
    const schema = createSchema({ blocks: [textBlock, cardBlock] });
    expect(getBlockType(schema, "text")?.id).toBe("text");
    expect(getBlockType(schema, "card")?.id).toBe("card");
  });

  it("returns undefined for unknown block type", () => {
    const schema = createSchema({ blocks: [textBlock] });
    expect(getBlockType(schema, "unknown")).toBeUndefined();
  });
});

describe("hasBlockType", () => {
  it("returns true for registered block type", () => {
    const schema = createSchema({ blocks: [textBlock] });
    expect(hasBlockType(schema, "text")).toBe(true);
  });

  it("returns false for unregistered block type", () => {
    const schema = createSchema({ blocks: [] });
    expect(hasBlockType(schema, "text")).toBe(false);
  });
});

describe("getBlockTypeNames", () => {
  it("returns empty array when no block types", () => {
    const schema = createSchema({ blocks: [] });
    expect(getBlockTypeNames(schema)).toEqual([]);
  });

  it("returns all block type names", () => {
    const schema = createSchema({ blocks: [textBlock, cardBlock] });
    const names = getBlockTypeNames(schema);
    expect(names).toHaveLength(2);
    expect(names).toContain("text");
    expect(names).toContain("card");
  });
});
