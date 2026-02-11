import { useEffect, useRef, useState } from "react";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useEditor } from "./use-editor.js";
import { cn } from "./lib/utils.js";

export const DRAG_TYPE_BLOCK_TYPE = "blockType";

export interface BlockPaletteProps {
  getBlockLabel?: (blockType: string) => string;
  className?: string;
}

export function BlockPalette({
  getBlockLabel = (name) => name,
  className,
}: BlockPaletteProps): React.ReactElement {
  const { allowedBlockTypes } = useEditor();

  return (
    <div className={className} role="region" aria-label="Block palette">
      <ul className="m-0 list-none p-0">
        {allowedBlockTypes.map((blockType) => (
          <BlockPaletteItem
            key={blockType}
            blockType={blockType}
            label={getBlockLabel(blockType)}
          />
        ))}
      </ul>
    </div>
  );
}

function BlockPaletteItem({
  blockType,
  label,
}: {
  blockType: string;
  label: string;
}): React.ReactElement {
  const ref = useRef<HTMLLIElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { setCurrentDragSource } = useEditor();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return draggable({
      element: el,
      getInitialData: () => ({ type: DRAG_TYPE_BLOCK_TYPE, blockType }),
      onDragStart: () => {
        setIsDragging(true);
        setCurrentDragSource({ type: "blockType", blockType });
      },
      onDrop: () => {
        setIsDragging(false);
        setCurrentDragSource(null);
      },
    });
  }, [blockType, setCurrentDragSource]);

  return (
    <li
      ref={ref}
      draggable={false}
      style={{ touchAction: "none" }}
      className={cn(
        "mb-1 cursor-grab rounded-md px-3 py-2",
        isDragging
          ? "bg-[var(--dnd-overlay,#eee)]"
          : "bg-[var(--editor-palette-item-bg,#f5f5f5)]",
      )}
    >
      {label}
    </li>
  );
}

export const DRAG_TYPE_BLOCK_TYPE_CONST = DRAG_TYPE_BLOCK_TYPE;
