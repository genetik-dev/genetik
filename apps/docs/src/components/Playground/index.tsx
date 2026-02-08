import { useMemo, useState, useCallback } from "react";
import { renderContent } from "@genetik/renderer-react";
import { parseContentJson } from "@genetik/content";
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

const componentMap: ComponentMap = {
  text: TextBlock,
  card: CardBlock,
};

export default function Playground() {
  const [raw, setRaw] = useState(DEFAULT_JSON);

  const parseResult = useMemo(() => parseContentJson(raw), [raw]);

  const preview = useMemo(() => {
    if (!parseResult.ok) return null;
    return renderContent(parseResult.content, playgroundSchema, componentMap);
  }, [parseResult]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRaw(e.target.value);
  }, []);

  return (
    <div className="playground">
      <div className="playground__editor">
        <label className="playground__label" htmlFor="playground-json">
          Content JSON
        </label>
        <textarea
          id="playground-json"
          className="playground__textarea"
          value={raw}
          onChange={handleChange}
          spellCheck={false}
        />
        {!parseResult.ok && (
          <div className="playground__error" role="alert">
            {parseResult.error}
          </div>
        )}
      </div>
      <div className="playground__preview">
        <span className="playground__label">Preview</span>
        <div className="playground__output">
          {preview ?? (parseResult.ok ? <span className="playground__muted">Enter valid content JSON.</span> : null)}
        </div>
      </div>
    </div>
  );
}
