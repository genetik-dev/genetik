/**
 * A node in the resolved tree: block type, config, and resolved children per slot.
 * Framework-agnostic; a React (or other) binding maps this to components.
 */
export interface ResolvedNode {
  /** Content node id (for React keys when rendering slot children). */
  id: string;
  /** Block type name. */
  block: string;
  /** Block-specific config. */
  config: Record<string, unknown>;
  /** Resolved children by slot name. Each slot is an ordered array of ResolvedNode. */
  slots: Record<string, ResolvedNode[]>;
}
