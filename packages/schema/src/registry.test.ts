import { describe, it, expect } from "vitest";
import {
  createSchema,
  registerBlockType,
  getBlockType,
  hasBlockType,
  getBlockTypeNames,
} from "./registry.js";
import type { BlockTypeDefinition } from "./types.js";

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
  configSchema: { type: "object", properties: { title: { type: "string" } } },
  slots: [
    { name: "children", multiple: true, referenceMode: "both" },
    { name: "footer", multiple: false, referenceMode: "id" },
  ],
};

describe("createSchema", () => {
  it("returns a schema with empty blockTypes map", () => {
    const schema = createSchema();
    expect(schema.blockTypes.size).toBe(0);
    expect(schema.meta).toBeUndefined();
  });

  it("accepts optional meta", () => {
    const schema = createSchema({ version: "1.0.0" });
    expect(schema.meta?.version).toBe("1.0.0");
  });
});

describe("registerBlockType / getBlockType", () => {
  it("registers and retrieves a block type", () => {
    const schema = createSchema();
    registerBlockType(schema, textBlock);
    const got = getBlockType(schema, "text");
    expect(got).toEqual(textBlock);
  });

  it("returns undefined for unknown block type", () => {
    const schema = createSchema();
    expect(getBlockType(schema, "unknown")).toBeUndefined();
  });

  it("overwrites when registering same name twice", () => {
    const schema = createSchema();
    registerBlockType(schema, textBlock);
    const updated = { ...textBlock, configSchema: { type: "object" } };
    registerBlockType(schema, updated);
    expect(getBlockType(schema, "text")).toEqual(updated);
  });
});

describe("hasBlockType", () => {
  it("returns true for registered block type", () => {
    const schema = createSchema();
    registerBlockType(schema, textBlock);
    expect(hasBlockType(schema, "text")).toBe(true);
  });

  it("returns false for unregistered block type", () => {
    const schema = createSchema();
    expect(hasBlockType(schema, "text")).toBe(false);
  });
});

describe("getBlockTypeNames", () => {
  it("returns empty array when no block types", () => {
    const schema = createSchema();
    expect(getBlockTypeNames(schema)).toEqual([]);
  });

  it("returns all registered names", () => {
    const schema = createSchema();
    registerBlockType(schema, textBlock);
    registerBlockType(schema, cardBlock);
    const names = getBlockTypeNames(schema);
    expect(names).toHaveLength(2);
    expect(names).toContain("text");
    expect(names).toContain("card");
  });
});
