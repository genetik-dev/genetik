import { describe, it, expect } from "vitest";
import { createSchema } from "@genetik/schema";
import { resolve } from "./resolve.js";
import type { GenetikContent } from "@genetik/content";
import type { BlockInput } from "@genetik/schema";

const textBlock: BlockInput = {
  id: "text",
  configSchema: { type: "object", properties: { content: { type: "string" } } },
  slots: [],
};

const cardBlock: BlockInput = {
  id: "card",
  configSchema: { type: "object", properties: { title: { type: "string" } } },
  slots: [{ name: "children", multiple: true }],
};

const schema = createSchema({ blocks: [textBlock, cardBlock] });

describe("resolve", () => {
  it("returns null when entryId is missing from nodes", () => {
    const content: GenetikContent = {
      entryId: "missing",
      nodes: {
        root: { id: "root", block: "text", config: { content: "Hi" } },
      },
    };
    expect(resolve(content, schema)).toBeNull();
  });

  it("resolves a single node with no slots", () => {
    const content: GenetikContent = {
      entryId: "root",
      nodes: {
        root: { id: "root", block: "text", config: { content: "Hello" } },
      },
    };
    const result = resolve(content, schema)!;
    expect(result.block).toBe("text");
    expect(result.config).toEqual({ content: "Hello" });
    expect(result.slots).toEqual({});
  });

  it("resolves a node with a slot of children", () => {
    const content: GenetikContent = {
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
    const result = resolve(content, schema)!;
    expect(result.block).toBe("card");
    expect(result.config).toEqual({ title: "Card" });
    expect(result.slots.children!).toHaveLength(2);
    expect(result.slots.children![0]!.block).toBe("text");
    expect(result.slots.children![0]!.config).toEqual({ content: "A" });
    expect(result.slots.children![1]!.block).toBe("text");
    expect(result.slots.children![1]!.config).toEqual({ content: "B" });
  });

  it("skips dangling slot references", () => {
    const content: GenetikContent = {
      entryId: "card1",
      nodes: {
        card1: {
          id: "card1",
          block: "card",
          config: {},
          children: ["t1", "missing", "t2"],
        },
        t1: { id: "t1", block: "text", config: { content: "A" } },
        t2: { id: "t2", block: "text", config: { content: "B" } },
      },
    };
    const result = resolve(content, schema)!;
    expect(result.slots.children!).toHaveLength(2);
    expect(result.slots.children![0]!.config).toEqual({ content: "A" });
    expect(result.slots.children![1]!.config).toEqual({ content: "B" });
  });

  it("resolves nested structure", () => {
    const content: GenetikContent = {
      entryId: "outer",
      nodes: {
        outer: {
          id: "outer",
          block: "card",
          config: { title: "Outer" },
          children: ["inner"],
        },
        inner: {
          id: "inner",
          block: "card",
          config: { title: "Inner" },
          children: ["leaf"],
        },
        leaf: { id: "leaf", block: "text", config: { content: "Leaf" } },
      },
    };
    const result = resolve(content, schema)!;
    expect(result.block).toBe("card");
    expect(result.slots.children!).toHaveLength(1);
    const inner = result.slots.children![0]!;
    expect(inner.block).toBe("card");
    expect(inner.config).toEqual({ title: "Inner" });
    expect(inner.slots.children!).toHaveLength(1);
    expect(inner.slots.children![0]!.block).toBe("text");
    expect(inner.slots.children![0]!.config).toEqual({ content: "Leaf" });
  });

  it("includes empty slot arrays for defined slots with no refs", () => {
    const content: GenetikContent = {
      entryId: "card1",
      nodes: {
        card1: {
          id: "card1",
          block: "card",
          config: {},
          children: [],
        },
      },
    };
    const result = resolve(content, schema)!;
    expect(result.slots.children!).toEqual([]);
  });

  it("accepts a JSON string and parses it before resolving", () => {
    const json = JSON.stringify({
      entryId: "root",
      nodes: { root: { id: "root", block: "text", config: { content: "From JSON" } } },
    });
    const result = resolve(json, schema)!;
    expect(result.block).toBe("text");
    expect(result.config).toEqual({ content: "From JSON" });
  });

  it("returns null when content is invalid JSON string", () => {
    expect(resolve("not json", schema)).toBeNull();
  });
});
