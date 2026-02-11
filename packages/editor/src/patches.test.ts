import { describe, it, expect } from "vitest";
import { applyPatch } from "@genetik/patches";
import type { GenetikContent } from "@genetik/content";
import { createSchema } from "@genetik/schema";
import {
  createAddToSlotPatch,
  createMoveToSlotPatch,
  createRemovePatch,
  createReorderPatch,
} from "./patches.js";

const schema = createSchema({
  blocks: [
    {
      id: "text",
      configSchema: { type: "object" },
      slots: [],
    },
    {
      id: "card",
      configSchema: { type: "object", properties: { title: { type: "string" } } },
      slots: [{ name: "children", multiple: true }],
    },
  ],
});

const initialContent: GenetikContent = {
  entryId: "root",
  nodes: {
    root: {
      id: "root",
      block: "card",
      config: { title: "Root" },
      children: [],
    },
  },
};

describe("createAddToSlotPatch", () => {
  it("adds a node and inserts into slot", () => {
    const patch = createAddToSlotPatch(
      initialContent,
      schema,
      "root",
      "children",
      "text"
    );
    const next = applyPatch(initialContent, patch);
    const rootNode = next.nodes["root"];
    expect(rootNode?.children).toHaveLength(1);
    const newId = (rootNode?.children as string[])[0];
    expect(next.nodes[newId!]).toEqual({
      id: newId,
      block: "text",
      config: {},
    });
  });

  it("uses default config from block configSchema when adding a block", () => {
    const schemaWithDefaults = createSchema({
      blocks: [
        { id: "text", configSchema: { type: "object" }, slots: [] },
        {
          id: "card",
          configSchema: {
            type: "object",
            properties: { title: { type: "string", default: "hello world" } },
          },
          slots: [{ name: "children", multiple: true }],
        },
      ],
    });
    const contentWithCardRoot: GenetikContent = {
      entryId: "root",
      nodes: {
        root: {
          id: "root",
          block: "card",
          config: {},
          children: [],
        },
      },
    };
    const patch = createAddToSlotPatch(
      contentWithCardRoot,
      schemaWithDefaults,
      "root",
      "children",
      "card"
    );
    const next = applyPatch(contentWithCardRoot, patch);
    const rootNode = next.nodes["root"];
    const newId = (rootNode?.children as string[])[0];
    expect(next.nodes[newId!]).toMatchObject({
      block: "card",
      config: { title: "hello world" },
    });
  });

  it("inserts at position when given", () => {
    const withOne = applyPatch(
      initialContent,
      createAddToSlotPatch(initialContent, schema, "root", "children", "text")
    );
    const withTwo = applyPatch(
      withOne,
      createAddToSlotPatch(withOne, schema, "root", "children", "text")
    );
    const root = withTwo.nodes["root"];
    const [id1, id2] = (root?.children as string[]) ?? [];
    const patch = createAddToSlotPatch(
      withTwo,
      schema,
      "root",
      "children",
      "text",
      { position: 1 }
    );
    const next = applyPatch(withTwo, patch);
    const order = (next.nodes["root"]?.children as string[]) ?? [];
    expect(order).toHaveLength(3);
    expect(order[0]).toBe(id1);
    expect(order[2]).toBe(id2);
    expect(order[1]).not.toBe(id2); // new node at index 1
  });
});

describe("createRemovePatch", () => {
  it("removes node and its id from parent slot", () => {
    const withChild = applyPatch(
      initialContent,
      createAddToSlotPatch(initialContent, schema, "root", "children", "text")
    );
    const childId = ((withChild.nodes["root"]?.children as string[]) ?? [])[0];
    const patch = createRemovePatch(withChild, childId!);
    const next = applyPatch(withChild, patch);
    expect(next.nodes[childId!]).toBeUndefined();
    expect(next.nodes["root"]?.children).toEqual([]);
  });
});

describe("createReorderPatch", () => {
  it("updates slot order", () => {
    const withTwo = applyPatch(
      initialContent,
      createAddToSlotPatch(initialContent, schema, "root", "children", "text")
    );
    const withTwo2 = applyPatch(
      withTwo,
      createAddToSlotPatch(withTwo, schema, "root", "children", "text")
    );
    const order = (withTwo2.nodes["root"]?.children as string[]) ?? [];
    const reversed = [...order].reverse();
    const patch = createReorderPatch(withTwo2, "root", "children", reversed);
    const next = applyPatch(withTwo2, patch);
    expect(next.nodes["root"]?.children).toEqual(reversed);
  });
});

describe("createMoveToSlotPatch", () => {
  it("moves node between two different slots", () => {
    const withCards = applyPatch(
      initialContent,
      createAddToSlotPatch(initialContent, schema, "root", "children", "card")
    );
    const withTwoCards = applyPatch(
      withCards,
      createAddToSlotPatch(withCards, schema, "root", "children", "card")
    );
    const [card1Id, card2Id] = (withTwoCards.nodes["root"]?.children as string[]) ?? [];
    const withChild = applyPatch(
      withTwoCards,
      createAddToSlotPatch(withTwoCards, schema, card1Id!, "children", "text")
    );
    const childId = (withChild.nodes[card1Id!]?.children as string[])?.[0];
    expect((withChild.nodes[card1Id!]?.children as string[]) ?? []).toHaveLength(1);
    expect((withChild.nodes[card2Id!]?.children as string[]) ?? []).toHaveLength(0);

    const patch = createMoveToSlotPatch(
      withChild,
      childId!,
      card1Id!,
      "children",
      card2Id!,
      "children",
      0
    );
    const next = applyPatch(withChild, patch);
    expect(next.nodes[card1Id!]?.children).toHaveLength(0);
    expect(next.nodes[card2Id!]?.children).toEqual([childId]);
  });

  it("reorders within same slot when from and to are the same", () => {
    const withThree = applyPatch(
      initialContent,
      createAddToSlotPatch(initialContent, schema, "root", "children", "text")
    );
    const withThree2 = applyPatch(
      withThree,
      createAddToSlotPatch(withThree, schema, "root", "children", "text")
    );
    const withThree3 = applyPatch(
      withThree2,
      createAddToSlotPatch(withThree2, schema, "root", "children", "text")
    );
    const order = (withThree3.nodes["root"]?.children as string[]) ?? [];
    const [a, b, c] = order;
    expect(c).toBeDefined();
    const patch = createMoveToSlotPatch(
      withThree3,
      c!,
      "root",
      "children",
      "root",
      "children",
      0
    );
    const next = applyPatch(withThree3, patch);
    expect(next.nodes["root"]?.children).toEqual([c, a, b]);
  });
});
