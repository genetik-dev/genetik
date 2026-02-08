import { describe, it, expect } from "vitest";
import { applyPatch } from "./apply.js";
import type { GenetikContent } from "@genetik/content";

const initial: GenetikContent = {
  entryId: "root",
  nodes: {
    root: {
      id: "root",
      block: "card",
      config: { title: "Root" },
      children: ["a", "b"],
    },
    a: { id: "a", block: "text", config: { content: "A" } },
    b: { id: "b", block: "text", config: { content: "B" } },
  },
};

describe("applyPatch", () => {
  it("addNode adds a node to the map", () => {
    const result = applyPatch(initial, {
      type: "addNode",
      id: "c",
      node: { id: "c", block: "text", config: { content: "C" } },
    });
    expect(result.nodes["c"]).toEqual({ id: "c", block: "text", config: { content: "C" } });
    expect(result.nodes["root"]!).toEqual(initial.nodes["root"]);
    expect(Object.keys(result.nodes)).toHaveLength(4);
  });

  it("addNode overwrites if id already exists", () => {
    const result = applyPatch(initial, {
      type: "addNode",
      id: "a",
      node: { id: "a", block: "text", config: { content: "A updated" } },
    });
    expect(result.nodes["a"]!.config).toEqual({ content: "A updated" });
  });

  it("removeNode removes the node and its id from parent slots", () => {
    const result = applyPatch(initial, {
      type: "removeNode",
      id: "a",
    });
    expect(result.nodes["a"]).toBeUndefined();
    expect(result.nodes["root"]!.children).toEqual(["b"]);
  });

  it("removeNode removes id from single-id slot", () => {
    const withSingle: GenetikContent = {
      entryId: "r",
      nodes: {
        r: { id: "r", block: "block", config: {}, header: "h" },
        h: { id: "h", block: "text", config: {} },
      },
    };
    const result = applyPatch(withSingle, { type: "removeNode", id: "h" });
    expect(result.nodes["h"]).toBeUndefined();
    expect("header" in result.nodes["r"]!).toBe(false);
  });

  it("updateConfig replaces node config", () => {
    const result = applyPatch(initial, {
      type: "updateConfig",
      id: "root",
      config: { title: "Updated" },
    });
    expect(result.nodes["root"]!.config).toEqual({ title: "Updated" });
    expect(result.nodes["root"]!.children).toEqual(["a", "b"]);
  });

  it("reorderSlot sets slot to new order", () => {
    const result = applyPatch(initial, {
      type: "reorderSlot",
      id: "root",
      slotName: "children",
      order: ["b", "a"],
    });
    expect(result.nodes["root"]!.children).toEqual(["b", "a"]);
  });

  it("reorderSlot is no-op if node does not exist", () => {
    const result = applyPatch(initial, {
      type: "reorderSlot",
      id: "missing",
      slotName: "children",
      order: [],
    });
    expect(result).toEqual(initial);
  });

  it("applies array of patches in order", () => {
    const result = applyPatch(initial, [
      {
        type: "addNode",
        id: "c",
        node: { id: "c", block: "text", config: { content: "C" } },
      },
      {
        type: "reorderSlot",
        id: "root",
        slotName: "children",
        order: ["a", "b", "c"],
      },
    ]);
    expect(result.nodes["root"]!.children).toEqual(["a", "b", "c"]);
    expect(result.nodes["c"]).toBeDefined();
  });

  it("does not mutate input content", () => {
    const before = JSON.stringify(initial);
    applyPatch(initial, {
      type: "updateConfig",
      id: "root",
      config: { title: "Changed" },
    });
    expect(JSON.stringify(initial)).toBe(before);
  });
});
