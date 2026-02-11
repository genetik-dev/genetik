import { createContext, useCallback, useMemo, type ReactNode } from "react";
import { applyPatch } from "@genetik/patches";
import {
  createAddToSlotPatch,
  createMoveToSlotPatch,
  createRemovePatch,
  createReorderPatch,
  createUpdateConfigPatch,
  getAllowedBlockTypes,
} from "@genetik/editor";
import type { EditorAction, EditorContextValue, EditorProviderProps } from "./types.js";

export const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({
  schema,
  content,
  onChange,
  componentMap,
  children,
}: EditorProviderProps & { children?: ReactNode }): React.ReactElement {
  const allowedBlockTypes = useMemo(() => getAllowedBlockTypes(schema), [schema]);

  const dispatch = useCallback<EditorContextValue["dispatch"]>(
    (action: EditorAction) => {
      switch (action.type) {
        case "addBlock": {
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
    }),
    [content, schema, onChange, dispatch, allowedBlockTypes, componentMap]
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}
