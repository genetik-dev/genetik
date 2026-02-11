import { describe, it, expect } from "vitest";
import { createSchema } from "./registry.js";
import { validateConfig, validateConfigAgainstDefinition } from "./validate.js";
import type { BlockInput, BlockTypeDefinition } from "./types.js";

const textBlock: BlockInput = {
  id: "text",
  configSchema: {
    type: "object",
    properties: {
      content: { type: "string" },
      level: { type: "number" },
    },
    required: ["content"],
  },
  slots: [],
};

const textBlockDefinition: BlockTypeDefinition = {
  ...textBlock,
  slots: [],
};

describe("validateConfig", () => {
  it("returns valid for config matching schema", () => {
    const schema = createSchema({ blocks: [textBlock] });
    const result = validateConfig(schema, "text", { content: "Hello" });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeNull();
  });

  it("returns valid when optional properties present", () => {
    const schema = createSchema({ blocks: [textBlock] });
    const result = validateConfig(schema, "text", { content: "Hi", level: 2 });
    expect(result.valid).toBe(true);
  });

  it("returns invalid for missing required property", () => {
    const schema = createSchema({ blocks: [textBlock] });
    const result = validateConfig(schema, "text", {});
    expect(result.valid).toBe(false);
    expect(result.errors).not.toBeNull();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("returns invalid for wrong type", () => {
    const schema = createSchema({ blocks: [textBlock] });
    const result = validateConfig(schema, "text", { content: 123 });
    expect(result.valid).toBe(false);
    expect(result.errors).not.toBeNull();
  });

  it("returns invalid for unknown block type", () => {
    const schema = createSchema({ blocks: [] });
    const result = validateConfig(schema, "unknown", { content: "x" });
    expect(result.valid).toBe(false);
    expect(result.errors).not.toBeNull();
    expect(result.errors!.some((e) => e.message?.includes("Unknown block type"))).toBe(true);
  });
});

describe("validateConfigAgainstDefinition", () => {
  it("returns valid for config matching definition", () => {
    const result = validateConfigAgainstDefinition(textBlockDefinition, { content: "Hello" });
    expect(result.valid).toBe(true);
    expect(result.errors).toBeNull();
  });

  it("returns invalid when schema constraint violated", () => {
    // level must be a number per configSchema.properties
    const result = validateConfigAgainstDefinition(textBlockDefinition, { content: "Hi", level: "not-a-number" });
    expect(result.valid).toBe(false);
    expect(result.errors).not.toBeNull();
  });
});
