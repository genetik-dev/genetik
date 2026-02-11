import { useMemo, useState, useCallback } from "react";
import { renderContent } from "@genetik/renderer-react";
import { parseContentJson } from "@genetik/content";
import type { GenetikContent } from "@genetik/content";
import {
  EditorProvider,
  EditorDndProvider,
  BlockPalette,
  EditorCanvas,
} from "@genetik/editor-react";
import { playgroundSchema } from "./schema";
import { TextBlock, CardBlock } from "./blockComponents";
import type { ComponentMap } from "@genetik/renderer-react";

const DEFAULT_JSON = `{
  "entryId": "root",
  "nodes": {
    "root": {
      "id": "root",
      "block": "card",
      "config": { "title": "Welcome" },
      "children": ["intro", "hint"]
    },
    "intro": {
      "id": "intro",
      "block": "text",
      "config": { "content": "Edit the JSON on the left to change this preview." }
    },
    "hint": {
      "id": "hint",
      "block": "text",
      "config": { "content": "Use block types: \\"text\\" (config.content) and \\"card\\" (config.title, slot: children)." }
    }
  }
}
`;

const INITIAL_CONTENT: GenetikContent = {
  entryId: "root",
  nodes: {
    root: {
      id: "root",
      block: "card",
      config: { title: "Welcome" },
      children: ["intro", "hint"],
    },
    intro: {
      id: "intro",
      block: "text",
      config: { content: "Edit the JSON on the left to change this preview." },
    },
    hint: {
      id: "hint",
      block: "text",
      config: {
        content:
          'Use block types: "text" (config.content) and "card" (config.title, slot: children).',
      },
    },
  },
};

const componentMap: ComponentMap = {
  text: TextBlock,
  card: CardBlock,
};

type PlaygroundMode = "json" | "visual";

export default function Playground() {
  const [raw, setRaw] = useState(DEFAULT_JSON);
  const [mode, setMode] = useState<PlaygroundMode>("visual");
  const [visualContent, setVisualContent] =
    useState<GenetikContent>(INITIAL_CONTENT);

  const parseResult = useMemo(() => parseContentJson(raw), [raw]);

  const contentForPreview =
    mode === "visual"
      ? visualContent
      : parseResult.ok
        ? parseResult.content
        : null;

  const preview = useMemo(() => {
    if (!contentForPreview) return null;
    return renderContent(contentForPreview, playgroundSchema, componentMap);
  }, [contentForPreview]);

  const handleJsonChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setRaw(e.target.value);
    },
    [],
  );

  const handleVisualContentChange = useCallback((content: GenetikContent) => {
    setVisualContent(content);
  }, []);

  return (
    <div className="playground">
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setMode("json")}
          style={{ marginRight: 8, fontWeight: mode === "json" ? 600 : 400 }}
        >
          Edit JSON
        </button>
        <button
          type="button"
          onClick={() => setMode("visual")}
          style={{ fontWeight: mode === "visual" ? 600 : 400 }}
        >
          Visual editor
        </button>
      </div>

      {mode === "json" && (
        <>
          <div className="playground__editor">
            <label className="playground__label" htmlFor="playground-json">
              Content JSON
            </label>
            <textarea
              id="playground-json"
              className="playground__textarea"
              value={raw}
              onChange={handleJsonChange}
              spellCheck={false}
            />
            {parseResult.ok === false && (
              <div className="playground__error" role="alert">
                {parseResult.error}
              </div>
            )}
          </div>
        </>
      )}

      {mode === "visual" && (
        <EditorProvider
          schema={playgroundSchema}
          content={visualContent}
          onChange={handleVisualContentChange}
          componentMap={componentMap}
        >
          <EditorDndProvider>
            <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
              <aside style={{ minWidth: 160 }}>
                <strong style={{ display: "block", marginBottom: 8 }}>
                  Blocks
                </strong>
                <BlockPalette />
              </aside>
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block", marginBottom: 8 }}>
                  Canvas
                </strong>
                <EditorCanvas />
              </div>
            </div>
          </EditorDndProvider>
        </EditorProvider>
      )}

      <div className="playground__preview">
        <span className="playground__label">Preview</span>
        <div className="playground__output">
          {preview ??
            (contentForPreview ? (
              <span className="playground__muted">
                Enter valid content JSON.
              </span>
            ) : null)}
        </div>
      </div>
    </div>
  );
}
