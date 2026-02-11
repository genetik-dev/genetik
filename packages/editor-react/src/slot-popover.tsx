import { useEditor } from "./use-editor.js";
import type { ReactNode } from "react";

export interface SlotPopoverProps {
  /** Anchor: slot's "add block" was clicked. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string;
  slotName: string;
  position?: number;
  /** Optional: custom trigger or anchor element. */
  children?: ReactNode;
}

export function SlotPopover({
  open,
  onOpenChange,
  parentId,
  slotName,
  position,
  children,
}: SlotPopoverProps): React.ReactElement {
  const { allowedBlockTypes, dispatch } = useEditor();

  function handleSelect(blockType: string): void {
    dispatch({
      type: "addBlock",
      parentId,
      slotName,
      blockType,
      position,
    });
    onOpenChange(false);
  }

  if (!open) return <>{children ?? null}</>;

  return (
    <div
      role="dialog"
      aria-label="Add block"
      className="absolute z-[1000] min-w-[160px] rounded-lg border border-[#ccc] bg-white p-2 shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
    >
      <div className="mb-2 text-xs font-semibold">Add block</div>
      <ul className="m-0 list-none p-0">
        {allowedBlockTypes.map((blockType) => (
          <li key={blockType}>
            <button
              type="button"
              onClick={() => handleSelect(blockType)}
              className="block w-full cursor-pointer rounded border-none bg-transparent p-1.5 pl-2 text-left"
            >
              {blockType}
            </button>
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
