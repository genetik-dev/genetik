import { useState } from "react";
import type { ReactNode } from "react";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@genetik/ui-react";
import { useEditor } from "./use-editor.js";

export interface SlotPopoverProps {
  parentId: string;
  slotName: string;
  position?: number;
  /** When set, only these block types are shown. Omit to show all. */
  allowedBlockTypes?: string[];
  /** Trigger element (e.g. "+ Add block" button). Click opens the popover. */
  children: ReactNode;
}

export function SlotPopover({
  parentId,
  slotName,
  position,
  allowedBlockTypes: slotAllowedBlockTypes,
  children,
}: SlotPopoverProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const { allowedBlockTypes: globalAllowedBlockTypes, dispatch } = useEditor();
  const allowedBlockTypes = slotAllowedBlockTypes ?? globalAllowedBlockTypes;

  function handleSelect(blockType: string): void {
    dispatch({
      type: "addBlock",
      parentId,
      slotName,
      blockType,
      position,
    });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={children} />
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="min-w-[160px] w-auto"
      >
        <PopoverHeader>
          <PopoverTitle className="text-xs font-semibold">
            Add block
          </PopoverTitle>
        </PopoverHeader>
        <div className="flex flex-col gap-0.5">
          {allowedBlockTypes.map((blockType) => (
            <Button
              key={blockType}
              type="button"
              variant="ghost"
              size="sm"
              className="justify-start"
              onClick={() => handleSelect(blockType)}
            >
              {blockType}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
