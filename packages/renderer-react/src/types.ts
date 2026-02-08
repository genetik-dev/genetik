import type { ComponentType, ReactNode } from "react";

/**
 * Props passed to every block component: config and resolved slot content.
 * Each slot is an array of React nodes (already rendered children).
 */
export interface BlockProps {
  /** Block-specific config from content. */
  config: Record<string, unknown>;
  /** Rendered children by slot name. Each value is an array of ReactNode. */
  slots: Record<string, ReactNode[]>;
}

/**
 * Map from block type name to React component. Used by renderContent.
 */
export type ComponentMap = Record<string, ComponentType<BlockProps>>;
