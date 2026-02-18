import type { ComponentType, ReactNode } from "react";
import type {
  PageContext,
  PageEventCallback,
  PageEventPayload,
  PageRuntimeOptions,
} from "@genetik/context-events";

/**
 * Props passed to every block component: config and resolved slot content.
 * When page runtime is available, context, updateContext, and emit are also passed.
 */
export interface BlockProps {
  /** Block-specific config (after context overrides when runtime is available). */
  config: Record<string, unknown>;
  /** Rendered children by slot name. Each value is an array of ReactNode. */
  slots: Record<string, ReactNode[]>;
  /** Page context (when wrapped in PageRuntimeProvider). */
  context?: PageContext;
  /** Update a context path (when wrapped in PageRuntimeProvider). */
  updateContext?: (path: string, value: unknown) => void;
  /** Emit a page event (when wrapped in PageRuntimeProvider). */
  emit?: (eventName: string, payload: PageEventPayload) => void;
}

/**
 * Map from block type name to React component. Used by renderContent.
 */
export type ComponentMap = Record<string, ComponentType<BlockProps>>;

/**
 * Optional options for renderContent: page context and events.
 * When provided, the tree is wrapped in PageRuntimeProvider; each block is wrapped so it
 * receives context, updateContext, emit, and effective config/visibility from config.contextOverrides.
 */
export interface RenderContentOptions extends PageRuntimeOptions {
  /** Called when a block updates context (e.g. toggle). Enables immutable updates in React state. */
  onContextUpdate?: (path: string, value: unknown) => void;
}
