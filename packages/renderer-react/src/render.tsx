import { createElement, Fragment } from "react";
import type { ReactNode } from "react";
import { resolve } from "@genetik/renderer";
import type { GenetikContent } from "@genetik/content";
import type { GenetikSchema } from "@genetik/schema";
import type { ResolvedNode } from "@genetik/renderer";
import type { BlockProps, ComponentMap } from "./types.js";

/**
 * Resolves content with the schema and renders the root with the component map.
 * Content may be a GenetikContent object or a JSON string (parsing is done by resolve).
 * Returns null if content is invalid, the entry node is missing, or cannot be resolved.
 */
export function renderContent(
  content: GenetikContent | string,
  schema: GenetikSchema,
  componentMap: ComponentMap,
): ReactNode {
  const root = resolve(content, schema);
  if (!root) return null;
  return renderNode(root, componentMap);
}

/**
 * Renders a resolved node tree with the given component map. Unknown block types
 * are skipped (render as null).
 */
export function renderNode(
  node: ResolvedNode,
  componentMap: ComponentMap,
): ReactNode {
  const Component = componentMap[node.block];
  if (!Component) return null;

  const slots: Record<string, ReactNode[]> = {};
  for (const [slotName, children] of Object.entries(node.slots)) {
    slots[slotName] = children.map((child) =>
      createElement(Fragment, { key: child.id }, renderNode(child, componentMap)),
    );
  }

  return createElement(Component, {
    config: node.config,
    slots,
  } as BlockProps);
}
