import { useEffect, useState } from "react";
import { getBlockType } from "@genetik/schema";
import { useEditor } from "./use-editor.js";
import { cn } from "./lib/utils.js";

type EditorInputKind = "text" | "number" | "textarea" | "checkbox";

function getEditorInputKind(
  propSchema: { type?: string; editorInput?: string }
): EditorInputKind {
  const kind = propSchema.editorInput as EditorInputKind | undefined;
  if (
    kind === "text" ||
    kind === "number" ||
    kind === "textarea" ||
    kind === "checkbox"
  ) {
    return kind;
  }
  const t = propSchema.type;
  if (t === "number") return "number";
  if (t === "boolean") return "checkbox";
  return "text";
}

export function ConfigSidePanel({
  nodeId,
  onClose,
}: {
  nodeId: string;
  onClose: () => void;
}): React.ReactElement {
  const { content, schema, dispatch } = useEditor();
  const node = content.nodes[nodeId];
  const blockType = node ? getBlockType(schema, node.block) : null;
  const configSchema = blockType?.configSchema as
    | {
        properties?: Record<
          string,
          { type?: string; default?: unknown; editorInput?: string }
        >;
      }
    | undefined;
  const properties = configSchema?.properties ?? {};

  const hasFormFields = Object.keys(properties).length > 0;
  const [formValues, setFormValues] = useState<Record<string, unknown>>(() => {
    if (!node) return {};
    const base = { ...node.config };
    for (const key of Object.keys(properties)) {
      if (!(key in base)) {
        const prop = properties[key];
        base[key] = (prop as { default?: unknown })?.default;
      }
    }
    return base;
  });
  const [json, setJson] = useState(() =>
    node ? JSON.stringify(node.config, null, 2) : "{}"
  );
  const [useRawJson, setUseRawJson] = useState(!hasFormFields);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (node) {
      const base = { ...node.config };
      for (const key of Object.keys(properties)) {
        if (!(key in base)) {
          const prop = properties[key];
          base[key] = (prop as { default?: unknown })?.default;
        }
      }
      setFormValues(base);
      setJson(JSON.stringify(node.config, null, 2));
    }
  }, [nodeId, node?.config]);

  if (!node) return <div />;

  const updateFormValue = (key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveForm = () => {
    setError(null);
    const config = { ...node.config, ...formValues };
    dispatch({ type: "updateBlockConfig", nodeId, config });
    onClose();
  };

  const handleSaveJson = () => {
    setError(null);
    try {
      const config = JSON.parse(json) as Record<string, unknown>;
      dispatch({ type: "updateBlockConfig", nodeId, config });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const currentValue = (key: string) => {
    const prop = properties[key];
    const fromForm = formValues[key];
    if (fromForm !== undefined) return fromForm;
    const fromConfig = node.config[key];
    if (fromConfig !== undefined) return fromConfig;
    return prop?.default;
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-[#ddd] bg-white shadow-lg"
        role="dialog"
        aria-labelledby="config-panel-title"
      >
        <div className="flex items-center justify-between border-b border-[#ddd] p-3">
          <h2 id="config-panel-title" className="text-sm font-semibold">
            Edit block
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#666] hover:bg-[#eee]"
            aria-label="Close"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>
        <div className="border-b border-[#ddd] px-3 py-2 text-xs text-[#666]">
          {node.block} · {nodeId}
        </div>
        <div className="flex-1 overflow-auto p-3">
          {hasFormFields && (
            <div className="mb-2 flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => setUseRawJson(false)}
                className={cn(
                  "rounded px-2 py-1",
                  !useRawJson && "bg-(--editor-drop-border,#2563eb) text-white"
                )}
              >
                Fields
              </button>
              <button
                type="button"
                onClick={() => setUseRawJson(true)}
                className={cn(
                  "rounded px-2 py-1",
                  useRawJson && "bg-(--editor-drop-border,#2563eb) text-white"
                )}
              >
                Raw JSON
              </button>
            </div>
          )}
          {useRawJson ? (
            <>
              <label className="mb-1 block text-xs font-medium text-[#444]">
                Config (JSON)
              </label>
              <textarea
                value={json}
                onChange={(e) => setJson(e.target.value)}
                className="mb-2 h-40 w-full resize-y rounded border border-[#ccc] p-2 font-mono text-xs"
                spellCheck={false}
                rows={10}
              />
              {error && (
                <p className="mb-2 text-xs text-red-600" role="alert">
                  {error}
                </p>
              )}
            </>
          ) : (
            <div className="space-y-3">
              {Object.entries(properties).map(([key, propSchema]) => {
                const kind = getEditorInputKind(propSchema ?? {});
                const value = currentValue(key);
                const label = key.replace(/_/g, " ");
                return (
                  <div key={key}>
                    <label
                      htmlFor={`config-${nodeId}-${key}`}
                      className="mb-0.5 block text-xs font-medium text-[#444]"
                    >
                      {label}
                    </label>
                    {kind === "checkbox" ? (
                      <input
                        id={`config-${nodeId}-${key}`}
                        type="checkbox"
                        checked={value === true}
                        onChange={(e) =>
                          updateFormValue(key, e.target.checked)
                        }
                        className="rounded border border-[#ccc]"
                      />
                    ) : kind === "number" ? (
                      <input
                        id={`config-${nodeId}-${key}`}
                        type="number"
                        value={
                          value === undefined || value === "" ? "" : Number(value)
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          updateFormValue(
                            key,
                            v === "" ? undefined : Number(v)
                          );
                        }}
                        className="w-full rounded border border-[#ccc] px-2 py-1.5 text-xs"
                      />
                    ) : kind === "textarea" ? (
                      <textarea
                        id={`config-${nodeId}-${key}`}
                        value={
                          typeof value === "string" ? value : String(value ?? "")
                        }
                        onChange={(e) =>
                          updateFormValue(key, e.target.value)
                        }
                        className="w-full rounded border border-[#ccc] px-2 py-1.5 font-mono text-xs"
                        rows={4}
                      />
                    ) : (
                      <input
                        id={`config-${nodeId}-${key}`}
                        type="text"
                        value={
                          typeof value === "string" ? value : String(value ?? "")
                        }
                        onChange={(e) =>
                          updateFormValue(key, e.target.value)
                        }
                        className="w-full rounded border border-[#ccc] px-2 py-1.5 text-xs"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t border-[#ddd] p-3">
          <button
            type="button"
            onClick={useRawJson ? handleSaveJson : handleSaveForm}
            className="rounded bg-(--editor-drop-border,#2563eb) px-3 py-1.5 text-xs text-white hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
