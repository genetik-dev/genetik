import { useContext } from "react";
import { EditorContext } from "./context";
import type { EditorContextValue } from "./types";

export function useEditor(): EditorContextValue {
  const value = useContext(EditorContext);
  if (!value) {
    throw new Error("useEditor must be used within EditorProvider");
  }
  return value;
}
