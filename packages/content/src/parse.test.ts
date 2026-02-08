import { describe, it, expect } from "vitest";
import { parseContentJson } from "./parse.js";

describe("parseContentJson", () => {
  it("returns content for valid JSON with entryId and nodes", () => {
    const raw = JSON.stringify({
      entryId: "root",
      nodes: { root: { id: "root", block: "text", config: {} } },
    });
    const result = parseContentJson(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.content.entryId).toBe("root");
      expect(result.content.nodes.root).toEqual({ id: "root", block: "text", config: {} });
    }
  });

  it("returns error for invalid JSON", () => {
    const result = parseContentJson("not json {");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("JSON");
  });

  it("returns error when entryId is missing", () => {
    const result = parseContentJson(JSON.stringify({ nodes: {} }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("entryId");
  });

  it("returns error when nodes is missing", () => {
    const result = parseContentJson(JSON.stringify({ entryId: "x" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("nodes");
  });
});
