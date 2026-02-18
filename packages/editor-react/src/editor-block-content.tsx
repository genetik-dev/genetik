import { createElement } from "react";
import { getBlockType } from "@genetik/schema";
import { getSlotAllowedBlockTypes } from "@genetik/editor";
import { applyContextOverrides } from "@genetik/context-events";
import { usePageRuntime } from "@genetik/renderer-react";
import type { BlockProps } from "@genetik/renderer-react";
import { useEditor } from "./use-editor";
import { SlotDropTarget } from "./slot-drop-target";
import { DraggableBlockWrapper } from "./draggable-block-wrapper";

export interface EditorBlockContentProps {
  nodeId: string;
  renderBlock: (childId: string) => React.ReactNode;
  /** When true, still render the block when visibility is false (e.g. editor shows it dimmed). */
  renderWhenHidden?: boolean;
}

/** Renders the actual block component (from componentMap) with editor slot wrappers and placeholders.
 * When the editor has context, applies context overrides (visibility/config) and passes context/updateContext to the block. */
export function EditorBlockContent({
  nodeId,
  renderBlock,
  renderWhenHidden = false,
}: EditorBlockContentProps): React.ReactElement | null {
  const { content, schema, componentMap, allowedBlockTypes: addableBlockTypes, context: editorContext } = useEditor();
  const runtime = usePageRuntime();
  const node = content.nodes[nodeId];
  if (!node) return null;

  const blockType = getBlockType(schema, node.block);
  if (!blockType) return null;

  const Component = componentMap?.[node.block];
  if (!Component) return null;

  const rawConfig = node.config as Record<string, unknown>;
  let config = rawConfig;
  let visible = true;
  if (editorContext !== undefined && runtime) {
    const result = applyContextOverrides(rawConfig, runtime.context);
    config = result.config;
    visible = result.visible;
  }
  if (!visible && !renderWhenHidden) return null;

  const slots: Record<string, React.ReactNode[]> = {};
  for (const slotDef of blockType.slots) {
    const value = node[slotDef.name];
    const ids = Array.isArray(value)
      ? (value as string[])
      : typeof value === "string"
        ? [value]
        : [];
    const slotAllowed = getSlotAllowedBlockTypes(schema, slotDef);
    const slotAllowedBlockTypes = slotAllowed.filter((t) => addableBlockTypes.includes(t));

    const slotContent = (
      <SlotDropTarget
        key={slotDef.name}
        parentId={nodeId}
        slotName={slotDef.name}
        nodeIds={ids}
        layout={slotDef.layout}
        allowedBlockTypes={slotAllowedBlockTypes}
        multiple={slotDef.multiple}
      >
        {ids.map((id, index) => (
          <DraggableBlockWrapper
            key={id}
            nodeId={id}
            parentId={nodeId}
            slotName={slotDef.name}
            index={index}
            slotLayout={slotDef.layout}
            slotAllowedBlockTypes={slotAllowedBlockTypes}
            slotMultiple={slotDef.multiple}
          >
            {renderBlock(id)}
          </DraggableBlockWrapper>
        ))}
      </SlotDropTarget>
    );
    slots[slotDef.name] = [slotContent];
  }

  const blockProps: BlockProps = {
    config,
    slots,
    ...(runtime && {
      context: runtime.context,
      updateContext: runtime.updateContext,
      emit: runtime.emit,
    }),
  };
  return createElement(Component, blockProps);
}
