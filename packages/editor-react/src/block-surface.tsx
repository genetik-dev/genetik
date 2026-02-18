import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyContextOverrides } from "@genetik/context-events";
import { Button } from "@genetik/ui-react";
import { Pencil, Trash2, EyeOff } from "lucide-react";
import { usePageRuntime } from "@genetik/renderer-react";
import { useEditor } from "./use-editor";
import { EditorBlockContent } from "./editor-block-content";

export interface BlockSurfaceProps {
  nodeId: string;
  onEditClick?: (nodeId: string) => void;
}

/** Wrapper with hover state and edit/remove buttons; renders block via EditorBlockContent. */
export function BlockSurface({
  nodeId,
  onEditClick,
}: BlockSurfaceProps): React.ReactElement | null {
  const { content, context: editorContext, dispatch } = useEditor();
  const runtime = usePageRuntime();
  const node = content.nodes[nodeId];
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const showActions = isHovered || isSelected;

  const visible = useMemo(() => {
    if (!node || editorContext === undefined || !runtime) return true;
    const { visible: v } = applyContextOverrides(
      node.config as Record<string, unknown>,
      runtime.context
    );
    return v;
  }, [node, editorContext, runtime]);

  /** True when the target is directly in this block (not inside a child block). */
  const isDirectTarget = useCallback(
    (target: EventTarget | null) =>
      (target as HTMLElement | null)?.closest?.("[data-node-id]")?.getAttribute("data-node-id") === nodeId,
    [nodeId]
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => setIsHovered(isDirectTarget(e.target)),
    [isDirectTarget]
  );
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => setIsHovered(isDirectTarget(e.target)),
    [isDirectTarget]
  );
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDirectTarget(e.target)) setIsSelected(true);
    },
    [isDirectTarget]
  );

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
      renderWhenHidden={true}
    />
  );

  const wrappedContent =
    visible ? contentNode : (
      <div className="opacity-50" aria-hidden="true">
        {contentNode}
      </div>
    );

  return (
    <div
      ref={wrapperRef}
      data-block={node.block}
      data-node-id={nodeId}
      data-visible={visible ? "true" : "false"}
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {showActions && (
        <div className="absolute top-0 right-0 z-10 flex gap-0.5 items-center">
          {!visible && (
            <span
              className="text-muted-foreground flex items-center"
              title="Hidden by context"
              aria-label="Hidden by context"
            >
              <EyeOff className="size-3.5" />
            </span>
          )}
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
      {wrappedContent}
    </div>
  );
}
