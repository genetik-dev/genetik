import { describe, it, expect } from "vitest";
import { createSchema, registerBlockType } from "./registry.js";
import { validateConfig, validateConfigAgainstDefinition } from "./validate.js";
import type { BlockTypeDefinition } from "./types.js";

const textBlock: BlockTypeDefinition = {
  name: "text",
  configSchema: {
    type: "object",
    properties: {
      content: { type: "string" },
      level: { type: "number", minimum: 1, maximum: 6 },
    },
    required: ["content"],
  },
  slots: [],
};

describe("validateConfig", () => {
  it("returns valid for config matching schema", () => {
    const schema = createSchema();
    registerBlockType(schema, textBlock);
    const result = validateConfig(schema, "text", { content: "Hello" });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeNull();
  });

  it("returns valid when optional properties present", () => {
    const schema = createSchema();
    registerBlockType(schema, textBlock);
    const result = validateConfig(schema, "text", { content: "Hi", level: 2 });
    expect(result.valid).toBe(true);
  });

  it("returns invalid for missing required property", () => {
    const schema = createSchema();
    registerBlockType(schema, textBlock);
    const result = validateConfig(schema, "text", {});
    expect(result.valid).toBe(false);
    expect(result.errors).not.toBeNull();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("returns invalid for wrong type", () => {
    const schema = createSchema();
    registerBlockType(schema, textBlock);
    const result = validateConfig(schema, "text", { content: 123 });
    expect(result.valid).toBe(false);
    expect(result.errors).not.toBeNull();
  });

  it("returns invalid for unknown block type", () => {
    const schema = createSchema();
    const result = validateConfig(schema, "unknown", { content: "x" });
    expect(result.valid).toBe(false);
    expect(result.errors).not.toBeNull();
    expect(result.errors!.some((e) => e.message?.includes("Unknown block type"))).toBe(true);
  });
});

describe("validateConfigAgainstDefinition", () => {
  it("returns valid for config matching definition", () => {
    const result = validateConfigAgainstDefinition(textBlock, { content: "Hello" });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeNull();
  });

  it("returns invalid when schema constraint violated", () => {
    const result = validateConfigAgainstDefinition(textBlock, { content: "Hi", level: 10 });
    expect(result.valid).toBe(false);
    expect(result.errors).not.toBeNull();
  });
});
