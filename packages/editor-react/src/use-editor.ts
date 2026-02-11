import { useContext } from "react";
import { EditorContext } from "./context.js";
import type { EditorContextValue } from "./types.js";

export function useEditor(): EditorContextValue {
  const value = useContext(EditorContext);
  if (!value) {
    throw new Error("useEditor must be used within EditorProvider");
  }
  return value;
}
