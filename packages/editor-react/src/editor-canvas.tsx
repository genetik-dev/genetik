import { useState } from "react";
import { useEditor } from "./use-editor.js";
import { EditorBlockContent } from "./editor-block-content.js";
import { BlockSurface } from "./block-surface.js";
import { SlotPopover } from "./slot-popover.js";
import { ConfigSidePanel } from "./config-side-panel.js";

export interface EditorCanvasProps {
  className?: string;
}

export function EditorCanvas({
  className,
}: EditorCanvasProps): React.ReactElement {
  const { content } = useEditor();
  const [popover, setPopover] = useState<{
    parentId: string;
    slotName: string;
    position?: number;
  } | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const root = content.nodes[content.entryId];
  if (!root) {
    return (
      <div className={className}>
        <p>No content. Add a root node to get started.</p>
      </div>
    );
  }

  const onAddClick = (parentId: string, slotName: string, position?: number) =>
    setPopover({ parentId, slotName, position });
  const onEditClick = setEditingNodeId;

  return (
    <div className={className} data-editor-canvas>
      <EditorBlockContent
        nodeId={root.id}
        onAddClick={onAddClick}
        renderBlock={(id) => (
          <BlockSurface
            nodeId={id}
            onAddClick={onAddClick}
            onEditClick={onEditClick}
          />
        )}
      />
      {popover && (
        <SlotPopover
          open
          onOpenChange={(open) => !open && setPopover(null)}
          parentId={popover.parentId}
          slotName={popover.slotName}
          position={popover.position}
        />
      )}
      {editingNodeId && (
        <ConfigSidePanel
          nodeId={editingNodeId}
          onClose={() => setEditingNodeId(null)}
        />
      )}
    </div>
  );
}
