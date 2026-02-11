import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@genetik/ui-react";
import { Pencil, Trash2 } from "lucide-react";
import { useEditor } from "./use-editor.js";
import { EditorBlockContent } from "./editor-block-content.js";

export interface BlockSurfaceProps {
  nodeId: string;
  onEditClick?: (nodeId: string) => void;
}

/** Wrapper with hover state and edit/remove buttons; renders block via EditorBlockContent. */
export function BlockSurface({
  nodeId,
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
      renderBlock={(id) => (
        <BlockSurface
          nodeId={id}
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
        <div className="absolute top-0 right-0 z-10 flex gap-0.5">
          {onEditClick && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(nodeId);
              }}
              aria-label="Edit block"
              className="text-muted-foreground hover:text-primary"
            >
              <Pencil />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: "removeBlock", nodeId });
            }}
            aria-label="Remove block"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      )}
      {contentNode}
    </div>
  );
}
