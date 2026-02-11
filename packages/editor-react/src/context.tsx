import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import { getBlockType } from "@genetik/schema";
import { applyPatch } from "@genetik/patches";
import {
  createAddToSlotPatch,
  createMoveToSlotPatch,
  createRemovePatch,
  createReorderPatch,
  createUpdateConfigPatch,
  getAddableBlockTypes,
} from "@genetik/editor";
import type {
  CurrentDragSource,
  EditorAction,
  EditorContextValue,
  EditorProviderProps,
} from "./types";

export const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({
  schema,
  content,
  onChange,
  componentMap,
  children,
}: EditorProviderProps & { children?: ReactNode }): React.ReactElement {
  const allowedBlockTypes = useMemo(() => getAddableBlockTypes(schema), [schema]);
  const [currentDragSource, setCurrentDragSource] = useState<CurrentDragSource>(null);

  const dispatch = useCallback<EditorContextValue["dispatch"]>(
    (action: EditorAction) => {
      switch (action.type) {
        case "addBlock": {
          const parent = content.nodes[action.parentId];
          const blockType = parent ? getBlockType(schema, parent.block as string) : undefined;
          const slotDef = blockType?.slots.find((s) => s.name === action.slotName);
          const slotVal = parent?.[action.slotName as keyof typeof parent];
          const currentLength = Array.isArray(slotVal) ? slotVal.length : typeof slotVal === "string" ? 1 : 0;
          if (slotDef?.multiple === false && currentLength >= 1) break;
          const patch = createAddToSlotPatch(
            content,
            schema,
            action.parentId,
            action.slotName,
            action.blockType,
            { position: action.position }
          );
          onChange(applyPatch(content, patch));
          break;
        }
        case "removeBlock": {
          const patch = createRemovePatch(content, action.nodeId);
          onChange(applyPatch(content, patch));
          break;
        }
        case "reorderSlot": {
          const patch = createReorderPatch(
            content,
            action.parentId,
            action.slotName,
            action.order
          );
          onChange(applyPatch(content, patch));
          break;
        }
        case "moveNode": {
          const toParent = content.nodes[action.toParentId];
          const toBlockType = toParent ? getBlockType(schema, toParent.block as string) : undefined;
          const toSlotDef = toBlockType?.slots.find((s) => s.name === action.toSlotName);
          const toSlotVal = toParent?.[action.toSlotName as keyof typeof toParent];
          const toOrder: string[] = Array.isArray(toSlotVal) ? toSlotVal : typeof toSlotVal === "string" ? [toSlotVal] : [];
          if (toSlotDef?.multiple === false && toOrder.length >= 1 && !toOrder.includes(action.nodeId)) break;
          const patch = createMoveToSlotPatch(
            content,
            action.nodeId,
            action.fromParentId,
            action.fromSlotName,
            action.toParentId,
            action.toSlotName,
            action.toIndex
          );
          onChange(applyPatch(content, patch));
          break;
        }
        case "updateBlockConfig": {
          const patch = createUpdateConfigPatch(content, action.nodeId, action.config);
          onChange(applyPatch(content, patch));
          break;
        }
      }
    },
    [content, schema, onChange]
  );

  const value: EditorContextValue = useMemo(
    () => ({
      content,
      schema,
      onChange,
      dispatch,
      allowedBlockTypes,
      componentMap,
      currentDragSource,
      setCurrentDragSource,
    }),
    [content, schema, onChange, dispatch, allowedBlockTypes, componentMap, currentDragSource]
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}
