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
import {
  PageBlock,
  TextBlock,
  CardBlock,
  RowBlock,
  ColumnBlock,
  ImageBlock,
} from "./blockComponents";
import type { ComponentMap } from "@genetik/renderer-react";

const INITIAL_CONTENT: GenetikContent = {
  entryId: "root",
  nodes: {
    root: {
      id: "root",
      block: "page",
      config: {},
      children: ["mainRow"],
    },
    mainRow: {
      id: "mainRow",
      block: "row",
      config: { gap: "normal" },
      children: ["mainCol"],
    },
    mainCol: {
      id: "mainCol",
      block: "column",
      config: {},
      children: ["intro", "hint", "sectionRow", "img1"],
    },
    intro: {
      id: "intro",
      block: "text",
      config: {
        content:
          "Edit the JSON or use the visual editor. Try: text, card, row, column, image.",
      },
    },
    hint: {
      id: "hint",
      block: "text",
      config: {
        content:
          "A row lays out its children (columns) horizontally. A column lays out its children vertically.",
      },
    },
    sectionRow: {
      id: "sectionRow",
      block: "row",
      config: { gap: "normal" },
      children: ["col1", "col2"],
    },
    col1: {
      id: "col1",
      block: "column",
      config: {},
      children: ["col1text"],
    },
    col1text: {
      id: "col1text",
      block: "text",
      config: { content: "Left column." },
    },
    col2: {
      id: "col2",
      block: "column",
      config: {},
      children: ["col2text"],
    },
    col2text: {
      id: "col2text",
      block: "text",
      config: { content: "Right column." },
    },
    img1: {
      id: "img1",
      block: "image",
      config: {
        src: "https://placehold.co/600x200?text=Placeholder",
        alt: "Placeholder",
        caption: "An image block.",
      },
    },
  },
};

const componentMap: ComponentMap = {
  page: PageBlock,
  text: TextBlock,
  card: CardBlock,
  row: RowBlock,
  column: ColumnBlock,
  image: ImageBlock,
};

type PlaygroundMode = "json" | "visual";

export default function Playground() {
  const [content, setContent] = useState<GenetikContent>(INITIAL_CONTENT);
  const [raw, setRaw] = useState(() =>
    JSON.stringify(INITIAL_CONTENT, null, 2)
  );
  const [mode, setMode] = useState<PlaygroundMode>("visual");

  const parseResult = useMemo(() => parseContentJson(raw), [raw]);

  const preview = useMemo(() => {
    return renderContent(content, playgroundSchema, componentMap);
  }, [content]);

  const handleJsonChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      setRaw(next);
      const result = parseContentJson(next);
      if (result.ok) setContent(result.content);
    },
    []
  );

  const handleVisualContentChange = useCallback((next: GenetikContent) => {
    setContent(next);
  }, []);

  const switchToJson = useCallback(() => {
    setRaw(JSON.stringify(content, null, 2));
    setMode("json");
  }, [content]);

  const switchToVisual = useCallback(() => {
    if (parseResult.ok) setContent(parseResult.content);
    setMode("visual");
  }, [parseResult]);

  return (
    <div className="playground">
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={switchToJson}
          style={{ marginRight: 8, fontWeight: mode === "json" ? 600 : 400 }}
        >
          Edit JSON
        </button>
        <button
          type="button"
          onClick={switchToVisual}
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
        <div data-twp>
          <EditorProvider
            schema={playgroundSchema}
            content={content}
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
        </div>
      )}

      <div className="playground__preview">
        <span className="playground__label">Preview</span>
        <div className="playground__output" data-twp>
          {preview ?? (
            <span className="playground__muted">
              No preview.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
