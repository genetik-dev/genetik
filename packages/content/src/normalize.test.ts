import { describe, it, expect } from "vitest";
import { createSchema, registerBlockType } from "@genetik/schema";
import { normalizeContent, validateContent } from "./index.js";
import type { BlockTypeDefinition } from "@genetik/schema";

const textBlock: BlockTypeDefinition = {
  name: "text",
  configSchema: {
    type: "object",
    properties: { content: { type: "string" } },
    required: ["content"],
  },
  slots: [],
};

const cardBlock: BlockTypeDefinition = {
  name: "card",
  configSchema: {
    type: "object",
    properties: { title: { type: "string" } },
  },
  slots: [{ name: "children", multiple: true, referenceMode: "both" }],
};

function schemaWithBlocks() {
  const schema = createSchema();
  registerBlockType(schema, textBlock);
  registerBlockType(schema, cardBlock);
  return schema;
}

describe("normalizeContent", () => {
  it("leaves already-canonical content unchanged", () => {
    const schema = schemaWithBlocks();
    const input = {
      entryId: "root",
      nodes: {
        root: { id: "root", block: "text", config: { content: "Hi" } },
      },
    };
    const result = normalizeContent(schema, input);
    expect(result.entryId).toBe("root");
    expect(Object.keys(result.nodes)).toEqual(["root"]);
    expect(result.nodes.root).toEqual(input.nodes.root);
  });

  it("flattens single inline node in slot and assigns id", () => {
    const schema = schemaWithBlocks();
    const input = {
      entryId: "card1",
      nodes: {
        card1: {
          id: "card1",
          block: "card",
          config: { title: "Card" },
          children: [
            {
              block: "text",
              config: { content: "Inline child" },
            },
          ],
        },
      },
    };
    const result = normalizeContent(schema, input);
    expect(result.entryId).toBe("card1");
    expect(Object.keys(result.nodes).length).toBe(2);
    expect(result.nodes.card1.children).toHaveLength(1);
    const childId = (result.nodes.card1.children as string[])[0];
    expect(childId).toBeDefined();
    expect(result.nodes[childId]).toEqual({
      id: childId,
      block: "text",
      config: { content: "Inline child" },
    });
  });

  it("preserves id references and flattens only inline in mixed slot", () => {
    const schema = schemaWithBlocks();
    const input = {
      entryId: "card1",
      nodes: {
        card1: {
          id: "card1",
          block: "card",
          config: {},
          children: [
            "existing-id",
            { block: "text", config: { content: "New" } },
          ],
        },
        "existing-id": { id: "existing-id", block: "text", config: { content: "Existing" } },
      },
    };
    const result = normalizeContent(schema, input);
    expect(result.entryId).toBe("card1");
    const children = result.nodes.card1.children as string[];
    expect(children[0]).toBe("existing-id");
    expect(children).toHaveLength(2);
    expect(result.nodes["existing-id"]).toEqual(input.nodes["existing-id"]);
    expect(result.nodes[children[1]].block).toBe("text");
    expect(result.nodes[children[1]].config).toEqual({ content: "New" });
  });

  it("flattens nested inline nodes", () => {
    const schema = schemaWithBlocks();
    const input = {
      entryId: "card1",
      nodes: {
        card1: {
          id: "card1",
          block: "card",
          config: { title: "Outer" },
          children: [
            {
              block: "card",
              config: { title: "Inner" },
              children: [{ block: "text", config: { content: "Deep" } }],
            },
          ],
        },
      },
    };
    const result = normalizeContent(schema, input);
    expect(result.entryId).toBe("card1");
    const topChildren = result.nodes.card1.children as string[];
    expect(topChildren).toHaveLength(1);
    const innerCard = result.nodes[topChildren[0]];
    expect(innerCard.block).toBe("card");
    expect(innerCard.config).toEqual({ title: "Inner" });
    const innerChildren = innerCard.children as string[];
    expect(innerChildren).toHaveLength(1);
    expect(result.nodes[innerChildren[0]]).toEqual({
      id: innerChildren[0],
      block: "text",
      config: { content: "Deep" },
    });
  });

  it("uses custom generateId when provided", () => {
    const schema = schemaWithBlocks();
    let n = 0;
    const generateId = () => `gen-${++n}`;
    const input = {
      entryId: "root",
      nodes: {
        root: {
          id: "root",
          block: "card",
          config: {},
          children: [{ block: "text", config: { content: "A" } }],
        },
      },
    };
    const result = normalizeContent(schema, input, { generateId });
    const childId = (result.nodes.root.children as string[])[0];
    expect(childId).toBe("gen-1");
    expect(result.nodes["gen-1"].config).toEqual({ content: "A" });
  });

  it("normalized content passes validation", () => {
    const schema = schemaWithBlocks();
    const input = {
      entryId: "card1",
      nodes: {
        card1: {
          id: "card1",
          block: "card",
          config: {},
          children: [
            { block: "text", config: { content: "One" } },
            { block: "text", config: { content: "Two" } },
          ],
        },
      },
    };
    const normalized = normalizeContent(schema, input);
    const validation = validateContent(schema, normalized);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });
});
