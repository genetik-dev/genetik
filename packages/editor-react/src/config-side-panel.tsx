import { useEffect, useState } from "react";
import { getBlockType } from "@genetik/schema";
import {
  Button,
  Checkbox,
  Input,
  Label,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@genetik/ui-react";
import { useEditor } from "./use-editor.js";

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
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent showCloseButton>
        <SheetHeader>
          <SheetTitle id="config-panel-title">Edit block</SheetTitle>
          <SheetDescription>
            {node.block} · {nodeId}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {hasFormFields && (
            <Tabs
              value={useRawJson ? "json" : "fields"}
              onValueChange={(v: string) => setUseRawJson(v === "json")}
              className="mb-2"
            >
              <TabsList variant="line" className="h-auto gap-1 p-0">
                <TabsTrigger value="fields">Fields</TabsTrigger>
                <TabsTrigger value="json">Raw JSON</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          {useRawJson ? (
            <>
              <Label htmlFor="config-json" className="mb-1 block text-xs">
                Config (JSON)
              </Label>
              <Textarea
                id="config-json"
                value={json}
                onChange={(e) => setJson(e.target.value)}
                className="mb-2 min-h-40 font-mono text-xs"
                spellCheck={false}
                rows={10}
              />
              {error && (
                <p className="mb-2 text-xs text-destructive" role="alert">
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
                const id = `config-${nodeId}-${key}`;
                return (
                  <div key={key}>
                    <Label htmlFor={id} className="mb-0.5 block text-xs">
                      {label}
                    </Label>
                    {kind === "checkbox" ? (
                      <Checkbox
                        id={id}
                        checked={value === true}
                        onCheckedChange={(checked: boolean) =>
                          updateFormValue(key, checked)
                        }
                      />
                    ) : kind === "number" ? (
                      <Input
                        id={id}
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
                        className="h-8 text-xs"
                      />
                    ) : kind === "textarea" ? (
                      <Textarea
                        id={id}
                        value={
                          typeof value === "string" ? value : String(value ?? "")
                        }
                        onChange={(e) =>
                          updateFormValue(key, e.target.value)
                        }
                        className="font-mono text-xs"
                        rows={4}
                      />
                    ) : (
                      <Input
                        id={id}
                        type="text"
                        value={
                          typeof value === "string" ? value : String(value ?? "")
                        }
                        onChange={(e) =>
                          updateFormValue(key, e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SheetBody>
        <SheetFooter>
          <Button
            onClick={useRawJson ? handleSaveJson : handleSaveForm}
            size="sm"
          >
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
