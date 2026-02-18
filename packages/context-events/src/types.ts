/**
 * Framework-agnostic contract for page context and events.
 * React integration lives in renderer-react and editor-react.
 */

/**
 * Namespaced page context. Each key is a namespace (e.g. "forms", "auth");
 * plugins and host agree on the shape per namespace.
 */
export type PageContext = Record<string, unknown>;

/**
 * Payload for a page event. Host and plugins define the shape per event name.
 */
export type PageEventPayload = unknown;

/**
 * Callback invoked when the page emits an event. Event names are prefixed
 * (e.g. "forms:submit"). The host receives and can route by prefix.
 */
export type PageEventCallback = (
  eventName: string,
  payload: PageEventPayload
) => void;

/**
 * Options passed to the renderer (or editor) for context and events.
 * Both are optional; when absent, blocks have no runtime context and
 * event emission is a no-op.
 */
export interface PageRuntimeOptions {
  /** Current page context (namespaced). */
  context?: PageContext;
  /** Called when the page emits an event (e.g. form submit). */
  onEvent?: PageEventCallback;
}

/**
 * Condition for a context override: equals or not equals.
 */
export type ContextOverrideCondition = "eq" | "neq";

/**
 * Effect of a context override: set a config property or set block visibility.
 */
export type ContextOverrideEffect =
  | { type: "config"; configProperty: string; configValue: unknown }
  | { type: "visibility"; visible: boolean };

/**
 * One context override: when context at contextPath matches contextValue (eq/neq),
 * apply the effect. Stored in block config as config.contextOverrides.
 * Last matching override wins.
 */
export interface ContextOverride {
  contextPath: string;
  condition: ContextOverrideCondition;
  contextValue: unknown;
  effect: ContextOverrideEffect;
}
