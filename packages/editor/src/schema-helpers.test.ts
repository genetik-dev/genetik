import { describe, it, expect } from "vitest";
import { createSchema } from "@genetik/schema";
import { editorSchemaPlugin } from "./schema-plugin.js";
import { getAddableBlockTypes, getDefaultConfig, getSlotAllowedBlockTypes } from "./schema-helpers.js";

describe("getDefaultConfig", () => {
  it("returns {} when block has no configSchema or no properties", () => {
    const schema = createSchema({
      blocks: [
        { id: "empty", configSchema: { type: "object" }, slots: [] },
        { id: "noProps", configSchema: { type: "object", properties: {} }, slots: [] },
      ],
    });
    expect(getDefaultConfig(schema, "empty")).toEqual({});
    expect(getDefaultConfig(schema, "noProps")).toEqual({});
  });

  it("returns {} for unknown block type", () => {
    const schema = createSchema({
      blocks: [{ id: "text", configSchema: { type: "object" }, slots: [] }],
    });
    expect(getDefaultConfig(schema, "unknown")).toEqual({});
  });

  it("picks default from configSchema.properties (default keyword)", () => {
    const schema = createSchema({
      blocks: [
        {
          id: "card",
          configSchema: {
            type: "object",
            properties: {
              title: { type: "string", default: "hello world" },
              count: { type: "number", default: 0 },
            },
          },
          slots: [],
        },
      ],
    });
    expect(getDefaultConfig(schema, "card")).toEqual({
      title: "hello world",
      count: 0,
    });
  });

  it("picks defaultValue when default is not set", () => {
    const schema = createSchema({
      blocks: [
        {
          id: "card",
          configSchema: {
            type: "object",
            properties: {
              title: { type: "string", default: "hello world" },
            },
          },
          slots: [],
        },
      ],
    });
    expect(getDefaultConfig(schema, "card")).toEqual({ title: "hello world" });
  });

  it("prefers default over defaultValue", () => {
    const schema = createSchema({
      blocks: [
        {
          id: "card",
          configSchema: {
            type: "object",
            properties: {
              title: { type: "string", default: "from default", defaultValue: "from defaultValue" } as { type: "string"; default?: string },
            },
          },
          slots: [],
        },
      ],
    });
    expect(getDefaultConfig(schema, "card")).toEqual({ title: "from default" });
  });

  it("omits properties without default or defaultValue", () => {
    const schema = createSchema({
      blocks: [
        {
          id: "card",
          configSchema: {
            type: "object",
            properties: {
              title: { type: "string", default: "hello" },
              optional: { type: "string" },
            },
          },
          slots: [],
        },
      ],
    });
    expect(getDefaultConfig(schema, "card")).toEqual({ title: "hello" });
  });
});

describe("getSlotAllowedBlockTypes", () => {
  const schema = createSchema({
    blocks: [
      { id: "text", configSchema: { type: "object" }, slots: [] },
      { id: "card", configSchema: { type: "object" }, slots: [] },
      { id: "row", configSchema: { type: "object" }, slots: [] },
      { id: "image", configSchema: { type: "object" }, slots: [] },
    ],
  });

  it("returns all block types when slot has no include or exclude", () => {
    const slot = { name: "children" as const, multiple: true as const, referenceMode: "id" as const };
    expect(getSlotAllowedBlockTypes(schema, slot)).toEqual(["text", "card", "row", "image"]);
  });

  it("returns only includeBlockNames (intersected with schema) when set", () => {
    const slot = {
      name: "children" as const,
      multiple: true as const,
      referenceMode: "id" as const,
      includeBlockNames: ["text", "card", "unknown"],
    };
    expect(getSlotAllowedBlockTypes(schema, slot)).toEqual(["text", "card"]);
  });

  it("returns all except excludeBlockNames when set", () => {
    const slot = {
      name: "children" as const,
      multiple: true as const,
      referenceMode: "id" as const,
      excludeBlockNames: ["image"],
    };
    expect(getSlotAllowedBlockTypes(schema, slot)).toEqual(["text", "card", "row"]);
  });
});

describe("getAddableBlockTypes", () => {
  it("returns all block types when none have addable: false", () => {
    const schema = createSchema({
      blocks: [
        { id: "a", configSchema: { type: "object" }, slots: [] },
        { id: "b", configSchema: { type: "object" }, slots: [] },
      ],
    });
    expect(getAddableBlockTypes(schema)).toEqual(["a", "b"]);
  });

  it("excludes block types with addable: false", () => {
    const schema = createSchema({
      blocks: [
        { id: "a", configSchema: { type: "object" }, slots: [] },
        { id: "page", configSchema: { type: "object" }, slots: [], addable: false },
        { id: "b", configSchema: { type: "object" }, slots: [] },
      ],
      plugins: [editorSchemaPlugin] as const,
    });
    expect(getAddableBlockTypes(schema)).toEqual(["a", "b"]);
  });
});
