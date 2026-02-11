import { useState } from "react";
import { useEditor } from "./use-editor";
import { EditorBlockContent } from "./editor-block-content";
import { BlockSurface } from "./block-surface";
import { ConfigSidePanel } from "./config-side-panel";

export interface EditorCanvasProps {
  className?: string;
}

export function EditorCanvas({
  className,
}: EditorCanvasProps): React.ReactElement {
  const { content } = useEditor();
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const root = content.nodes[content.entryId];
  if (!root) {
    return (
      <div className={className}>
        <p>No content. Add a root node to get started.</p>
      </div>
    );
  }

  const onEditClick = setEditingNodeId;

  return (
    <div className={className} data-editor-canvas>
      <EditorBlockContent
        nodeId={root.id}
        renderBlock={(id) => (
          <BlockSurface
            nodeId={id}
            onEditClick={onEditClick}
          />
        )}
      />
      {editingNodeId && (
        <ConfigSidePanel
          nodeId={editingNodeId}
          onClose={() => setEditingNodeId(null)}
        />
      )}
    </div>
  );
}
