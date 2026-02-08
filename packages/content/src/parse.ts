import type { GenetikContent } from "./types.js";

/**
 * Result of parsing a content JSON string. Use this when parsing user or API input
 * so you can show a clear error instead of throwing.
 */
export type ParseContentResult =
  | { ok: true; content: GenetikContent }
  | { ok: false; error: string };

/**
 * Parses a JSON string into content and checks the minimal shape (entryId and nodes).
 * Does not validate against a schema or normalize; use validateContent and
 * normalizeContent for that.
 *
 * @param raw - JSON string (e.g. from user input or API)
 * @returns ParseContentResult: either { ok: true, content } or { ok: false, error }
 */
export function parseContentJson(raw: string): ParseContentResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }

  if (parsed === null || typeof parsed !== "object") {
    return { ok: false, error: "Content must be an object" };
  }

  const obj = parsed as Record<string, unknown>;
  if (typeof obj.entryId !== "string") {
    return { ok: false, error: "Content must have entryId (string)" };
  }
  if (obj.nodes === null || typeof obj.nodes !== "object") {
    return { ok: false, error: "Content must have nodes (object)" };
  }

  return { ok: true, content: obj as unknown as GenetikContent };
}
