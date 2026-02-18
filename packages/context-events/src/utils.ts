import type {
  ContextOverride,
  PageContext,
  PageEventCallback,
  PageEventPayload,
} from "./types.js";

const CONTEXT_OVERRIDES_KEY = "contextOverrides";

function normalizeForComparison(value: unknown): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

function contextValueMatches(
  actual: unknown,
  expected: unknown,
  condition: "eq" | "neq"
): boolean {
  const a = normalizeForComparison(actual);
  const b = normalizeForComparison(expected);
  const eq =
    a === b ||
    (typeof a === "object" &&
      a !== null &&
      typeof b === "object" &&
      b !== null &&
      JSON.stringify(a) === JSON.stringify(b));
  return condition === "eq" ? eq : !eq;
}

/**
 * Compute effective config and visibility from raw config and context.
 * Extracts config.contextOverrides; applies each matching override (last wins).
 * Default visibility is true.
 */
export function applyContextOverrides(
  rawConfig: Record<string, unknown>,
  context: PageContext
): { config: Record<string, unknown>; visible: boolean } {
  const overrides = rawConfig[CONTEXT_OVERRIDES_KEY] as
    | ContextOverride[]
    | undefined;
  const baseConfig: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawConfig)) {
    if (key !== CONTEXT_OVERRIDES_KEY) baseConfig[key] = value;
  }
  let config = { ...baseConfig };
  let visible = true;

  if (!Array.isArray(overrides)) return { config, visible };

  for (const o of overrides) {
    if (
      !o ||
      typeof o.contextPath !== "string" ||
      !o.effect
    )
      continue;
    const actual = getContextValue(context, o.contextPath);
    if (!contextValueMatches(actual, o.contextValue, o.condition)) continue;
    if (o.effect.type === "config") {
      config = { ...config, [o.effect.configProperty]: o.effect.configValue };
    } else {
      visible = o.effect.visible === true;
    }
  }
  return { config, visible };
}

/**
 * Read a value from context by dot-separated path (e.g. "forms.values.email").
 * Returns undefined if the path is missing or empty.
 */
export function getContextValue(context: PageContext, path: string): unknown {
  if (path.trim() === "") return undefined;
  const segments = path.split(".");
  let current: unknown = context;
  for (const segment of segments) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/**
 * Set a value at a dot-separated path. Creates nested objects as needed.
 * Mutates context. No-op if path is empty.
 */
export function setContextValue(
  context: PageContext,
  path: string,
  value: unknown
): void {
  const trimmed = path.trim();
  if (trimmed === "") return;
  const segments = trimmed.split(".").filter((s) => s.length > 0);
  if (segments.length === 0) return;
  let current: Record<string, unknown> = context;
  const lastIndex = segments.length - 1;
  for (let i = 0; i < lastIndex; i++) {
    const key = segments[i]!;
    const next = current[key];
    if (next === null || typeof next !== "object") {
      const nextObj: Record<string, unknown> = {};
      current[key] = nextObj;
      current = nextObj;
    } else {
      current = next as Record<string, unknown>;
    }
  }
  current[segments[lastIndex]!] = value;
}

/**
 * True if a value exists at path and is not undefined.
 */
export function hasContextValue(context: PageContext, path: string): boolean {
  const value = getContextValue(context, path);
  return value !== undefined;
}

/**
 * Returns a function that calls onEvent when invoked, or a no-op if onEvent is undefined.
 * Lets blocks/plugins call emit(eventName, payload) without checking for onEvent.
 */
export function createEventEmitter(
  onEvent: PageEventCallback | undefined
): (eventName: string, payload: PageEventPayload) => void {
  return (eventName: string, payload: PageEventPayload) => {
    onEvent?.(eventName, payload);
  };
}
