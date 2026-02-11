import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor } from "./use-editor.js";
import { EditorBlockContent } from "./editor-block-content.js";
import { EditIcon, TrashIcon } from "./editor-icons.js";

export interface BlockSurfaceProps {
  nodeId: string;
  onAddClick: (parentId: string, slotName: string, position?: number) => void;
  onEditClick?: (nodeId: string) => void;
}

/** Wrapper with hover state and edit/remove buttons; renders block via EditorBlockContent. */
export function BlockSurface({
  nodeId,
  onAddClick,
  onEditClick,
}: BlockSurfaceProps): React.ReactElement | null {
  const { content, dispatch } = useEditor();
  const node = content.nodes[nodeId];
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const showActions = isHovered || isSelected;

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setIsSelected(false);
    }
  }, []);

  useEffect(() => {
    if (!isSelected) return;
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSelected, handleClickOutside]);

  if (!node) return null;

  const contentNode = (
    <EditorBlockContent
      nodeId={nodeId}
      onAddClick={onAddClick}
      renderBlock={(id) => (
        <BlockSurface
          nodeId={id}
          onAddClick={onAddClick}
          onEditClick={onEditClick}
        />
      )}
    />
  );

  return (
    <div
      ref={wrapperRef}
      data-block={node.block}
      data-node-id={nodeId}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsSelected(true)}
    >
      {showActions && (
        <div className="absolute top-0 right-0 z-10 flex -translate-y-1/2 translate-x-1/2 gap-0.5">
          {onEditClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(nodeId);
              }}
              className="rounded p-1 text-[#666] hover:bg-[#eee] hover:text-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-1"
              aria-label="Edit block"
            >
              <EditIcon />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: "removeBlock", nodeId });
            }}
            className="rounded p-1 text-[#666] hover:bg-[#eee] hover:text-[#c00] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-1"
            aria-label="Remove block"
          >
            <TrashIcon />
          </button>
        </div>
      )}
      {contentNode}
    </div>
  );
}
