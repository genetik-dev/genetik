import { createElement, type ComponentType, type ReactNode } from "react";
import { applyContextOverrides } from "@genetik/context-events";
import { usePageRuntime } from "./page-runtime-context.jsx";
import type { BlockProps } from "./types.js";

export interface BlockWithContextWrapperProps {
  nodeConfig: Record<string, unknown>;
  slots: Record<string, ReactNode[]>;
  blockComponent: ComponentType<BlockProps>;
}

/**
 * Wraps a block so it receives context, updateContext, emit, and effective config/visibility.
 * When page runtime is available, applies config.contextOverrides; when not, passes config through.
 */
export function BlockWithContextWrapper({
  nodeConfig,
  slots,
  blockComponent,
}: BlockWithContextWrapperProps): ReactNode {
  const runtime = usePageRuntime();
  const Component = blockComponent as ComponentType<BlockProps>;

  if (!runtime) {
    return createElement(Component, {
      config: nodeConfig,
      slots,
    } as BlockProps);
  }

  const { config, visible } = applyContextOverrides(nodeConfig, runtime.context);
  if (!visible) return null;

  return createElement(Component, {
    config,
    slots,
    context: runtime.context,
    updateContext: runtime.updateContext,
    emit: runtime.emit,
  } as BlockProps);
}
