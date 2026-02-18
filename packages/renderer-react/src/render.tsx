import { createElement, Fragment } from "react";
import type { ReactNode } from "react";
import { resolve } from "@genetik/renderer";
import type { GenetikContent } from "@genetik/content";
import type { GenetikSchema } from "@genetik/schema";
import type { ResolvedNode } from "@genetik/renderer";
import type { BlockProps, ComponentMap, RenderContentOptions } from "./types.js";
import { PageRuntimeProvider } from "./page-runtime-context.jsx";
import { BlockWithContextWrapper } from "./block-with-context-wrapper.jsx";

/**
 * Resolves content with the schema and renders the root with the component map.
 * Optional fourth argument: page runtime options (context, onEvent, onContextUpdate).
 * When provided, the tree is wrapped in PageRuntimeProvider and each block is wrapped
 * so it receives context, updateContext, emit, and effective config/visibility from config.contextOverrides.
 */
export function renderContent(
  content: GenetikContent | string,
  schema: GenetikSchema,
  componentMap: ComponentMap,
  options?: RenderContentOptions
): ReactNode {
  const root = resolve(content, schema);
  if (!root) return null;

  const useContextWrapper = options?.context !== undefined;
  const tree = renderNode(root, componentMap, useContextWrapper);

  if (useContextWrapper && options) {
    return createElement(
      PageRuntimeProvider,
      {
        context: options.context ?? {},
        onContextUpdate: options.onContextUpdate,
        onEvent: options.onEvent,
        children: tree,
      }
    );
  }

  return tree;
}

/**
 * Renders a resolved node. When useContextWrapper is true, wraps each block in BlockWithContextWrapper
 * so it gets effective config/visibility from contextOverrides and context/updateContext/emit in props.
 */
export function renderNode(
  node: ResolvedNode,
  componentMap: ComponentMap,
  useContextWrapper: boolean
): ReactNode {
  const Component = componentMap[node.block];
  if (!Component) return null;

  const slots: Record<string, ReactNode[]> = {};
  for (const [slotName, children] of Object.entries(node.slots)) {
    slots[slotName] = children.map((child) =>
      createElement(
        Fragment,
        { key: child.id },
        renderNode(child, componentMap, useContextWrapper)
      )
    );
  }

  const config = node.config as Record<string, unknown>;

  if (useContextWrapper) {
    return createElement(BlockWithContextWrapper, {
      nodeConfig: config,
      slots,
      blockComponent: Component,
    });
  }

  return createElement(Component, {
    config,
    slots,
  } as BlockProps);
}
