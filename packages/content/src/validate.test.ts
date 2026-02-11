import { describe, it, expect } from "vitest";
import { createSchema } from "@genetik/schema";
import { validateContent } from "./validate.js";
import type { BlockInput } from "@genetik/schema";

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
  configSchema: {
    type: "object",
    properties: { title: { type: "string" } },
  },
  slots: [{ name: "children", multiple: true }],
};

function schemaWithBlocks() {
  return createSchema({ blocks: [textBlock, cardBlock] });
}

describe("validateContent", () => {
  it("returns valid for minimal content with one node", () => {
    const schema = schemaWithBlocks();
    const content = {
      entryId: "root",
      nodes: {
        root: {
          id: "root",
          block: "text",
          config: { content: "Hello" },
        },
      },
    };
    const result = validateContent(schema, content);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns valid for content with slot references", () => {
    const schema = schemaWithBlocks();
    const content = {
      entryId: "card1",
      nodes: {
        card1: {
          id: "card1",
          block: "card",
          config: { title: "Card" },
          children: ["t1", "t2"],
        },
        t1: { id: "t1", block: "text", config: { content: "A" } },
        t2: { id: "t2", block: "text", config: { content: "B" } },
      },
    };
    const result = validateContent(schema, content);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns invalid when content is not an object", () => {
    const schema = schemaWithBlocks();
    expect(validateContent(schema, null).valid).toBe(false);
    expect(validateContent(schema, 1).valid).toBe(false);
    expect(validateContent(schema, []).valid).toBe(false);
    const r = validateContent(schema, null);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.errors[0]!.message).toContain("object");
  });

  it("returns invalid when entryId is missing or empty", () => {
    const schema = schemaWithBlocks();
    const noEntry = { nodes: {} };
    const r1 = validateContent(schema, noEntry);
    expect(r1.valid).toBe(false);
    expect(r1.errors.some((e) => e.path === "entryId")).toBe(true);

    const emptyEntry = { entryId: "", nodes: {} };
    const r2 = validateContent(schema, emptyEntry);
    expect(r2.valid).toBe(false);
  });

  it("returns invalid when entryId is not in nodes", () => {
    const schema = schemaWithBlocks();
    const content = {
      entryId: "missing",
      nodes: {
        root: { id: "root", block: "text", config: { content: "Hi" } },
      },
    };
    const result = validateContent(schema, content);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("not in nodes"))).toBe(true);
  });

  it("returns invalid when node has unknown block type", () => {
    const schema = schemaWithBlocks();
    const content = {
      entryId: "root",
      nodes: {
        root: {
          id: "root",
          block: "unknown",
          config: {},
        },
      },
    };
    const result = validateContent(schema, content);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message?.includes("Unknown block type"))).toBe(true);
  });

  it("returns invalid when node config fails schema", () => {
    const schema = schemaWithBlocks();
    const content = {
      entryId: "root",
      nodes: {
        root: {
          id: "root",
          block: "text",
          config: {}, // missing required "content"
        },
      },
    };
    const result = validateContent(schema, content);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes("config"))).toBe(true);
  });

  it("returns invalid when node id does not match map key", () => {
    const schema = schemaWithBlocks();
    const content = {
      entryId: "root",
      nodes: {
        root: {
          id: "other",
          block: "text",
          config: { content: "Hi" },
        },
      },
    };
    const result = validateContent(schema, content);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message?.includes("match map key"))).toBe(true);
  });

  it("returns invalid when slot has unknown name", () => {
    const schema = schemaWithBlocks();
    const content = {
      entryId: "root",
      nodes: {
        root: {
          id: "root",
          block: "text",
          config: { content: "Hi" },
          extraSlot: "x",
        },
      },
    };
    const result = validateContent(schema, content);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message?.includes("Unknown slot"))).toBe(true);
  });

  it("returns invalid when slot value shape is wrong (single vs array)", () => {
    const schema = schemaWithBlocks();
    const content = {
      entryId: "card1",
      nodes: {
        card1: {
          id: "card1",
          block: "card",
          config: {},
          children: "t1", // should be array for multiple: true
        },
        t1: { id: "t1", block: "text", config: { content: "A" } },
      },
    };
    const result = validateContent(schema, content);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message?.includes("array of ids"))).toBe(true);
  });

  it("returns invalid for dangling slot reference", () => {
    const schema = schemaWithBlocks();
    const content = {
      entryId: "card1",
      nodes: {
        card1: {
          id: "card1",
          block: "card",
          config: {},
          children: ["t1", "missing-id"],
        },
        t1: { id: "t1", block: "text", config: { content: "A" } },
      },
    };
    const result = validateContent(schema, content);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message?.includes("dangling") || e.message?.includes("not in nodes"))).toBe(
      true
    );
  });
});
