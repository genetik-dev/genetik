import { createElement } from "react";
import { getBlockType } from "@genetik/schema";
import { useEditor } from "./use-editor.js";
import { SlotDropTarget } from "./slot-drop-target.js";
import { DraggableBlockWrapper } from "./draggable-block-wrapper.js";

export interface EditorBlockContentProps {
  nodeId: string;
  onAddClick: (parentId: string, slotName: string, position?: number) => void;
  renderBlock: (childId: string) => React.ReactNode;
}

/** Renders the actual block component (from componentMap) with editor slot wrappers and placeholders. */
export function EditorBlockContent({
  nodeId,
  onAddClick,
  renderBlock,
}: EditorBlockContentProps): React.ReactElement | null {
  const { content, schema, componentMap } = useEditor();
  const node = content.nodes[nodeId];
  if (!node) return null;

  const blockType = getBlockType(schema, node.block);
  if (!blockType) return null;

  const Component = componentMap?.[node.block];
  if (!Component) return null;

  const slots: Record<string, React.ReactNode[]> = {};
  for (const slotDef of blockType.slots) {
    const value = node[slotDef.name];
    const ids = Array.isArray(value)
      ? (value as string[])
      : typeof value === "string"
        ? [value]
        : [];

    const slotContent = (
      <SlotDropTarget
        parentId={nodeId}
        slotName={slotDef.name}
        nodeIds={ids}
        onAddClick={() => onAddClick(nodeId, slotDef.name)}
      >
        {ids.map((id, index) => (
          <DraggableBlockWrapper
            key={id}
            nodeId={id}
            parentId={nodeId}
            slotName={slotDef.name}
            index={index}
          >
            {renderBlock(id)}
          </DraggableBlockWrapper>
        ))}
      </SlotDropTarget>
    );
    slots[slotDef.name] = [slotContent];
  }

  return createElement(Component, {
    config: node.config,
    slots,
  } as { config: Record<string, unknown>; slots: Record<string, React.ReactNode[]> });
}
