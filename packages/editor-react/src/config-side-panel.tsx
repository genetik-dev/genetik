import { useEffect, useState } from "react";
import { getBlockType } from "@genetik/schema";
import type {
  ContextOverride,
  ContextOverrideCondition,
  ContextOverrideEffect,
} from "@genetik/context-events";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@genetik/ui-react";
import { useEditor } from "./use-editor";

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

function parseContextValue(s: string): unknown {
  const t = s.trim();
  if (t === "") return undefined;
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

function contextValueToInput(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

const DEFAULT_OVERRIDE: ContextOverride = {
  contextPath: "",
  condition: "eq",
  contextValue: "",
  effect: { type: "visibility", visible: false },
};

function ContextOverridesSection({
  overrides,
  setOverrides,
  contextKeys,
  parseContextValue,
  contextValueToInput,
  defaultOverride,
  portalContainer,
}: {
  overrides: ContextOverride[];
  setOverrides: React.Dispatch<React.SetStateAction<ContextOverride[]>>;
  /** Context keys from page context schema (filtered by block's availableContexts when set). */
  contextKeys: string[];
  parseContextValue: (s: string) => unknown;
  contextValueToInput: (v: unknown) => string;
  defaultOverride: ContextOverride;
  portalContainer?: HTMLElement | React.RefObject<HTMLElement | null> | null;
}) {
  const updateOverride = (index: number, patch: Partial<ContextOverride>) => {
    setOverrides((prev) =>
      prev.map((o, i) => (i === index ? { ...o, ...patch } : o))
    );
  };
  const updateEffect = (
    index: number,
    effect: ContextOverrideEffect
  ) => {
    setOverrides((prev) =>
      prev.map((o, i) => (i === index ? { ...o, effect } : o))
    );
  };
  const addOverride = () => {
    const firstKey =
      contextKeys.length > 0 ? (contextKeys[0] ?? "") : "";
    setOverrides((prev) => [
      ...prev,
      { ...defaultOverride, contextPath: firstKey },
    ]);
  };
  const removeOverride = (index: number) =>
    setOverrides((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="mt-4 space-y-2 border-t pt-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Context overrides</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={addOverride}
        >
          +
        </Button>
      </div>
      {overrides.length === 0 ? (
        <p className="text-muted-foreground text-xs">No overrides. Add one to change config or visibility when context matches.</p>
      ) : (
        <ul className="space-y-3">
          {overrides.map((override, index) => (
            <li
              key={index}
              className="rounded-md border bg-muted/30 p-2 space-y-2.5"
            >
              <div className="flex flex-wrap items-center gap-2 gap-y-2">
                {contextKeys.length > 0 ? (
                  <Select
                    value={((override.contextPath || contextKeys[0]) ?? "") as string}
                    onValueChange={(v) =>
                      updateOverride(index, {
                        contextPath: v != null ? v : "",
                      })
                    }
                  >
                    <SelectTrigger size="sm" className="h-7 min-w-[10rem] max-w-[12rem] text-xs">
                      <SelectValue placeholder="Context key" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4} portalContainer={portalContainer}>
                      {contextKeys.map((k) => (
                        <SelectItem key={k} value={k} className="text-xs">
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    value={override.contextPath}
                    onChange={(e) =>
                      updateOverride(index, { contextPath: e.target.value })
                    }
                    placeholder="Context path"
                    className="h-7 text-xs w-40 shrink-0"
                    title="Dot-separated path, e.g. forms.values.email"
                  />
                )}
                <Select
                  value={override.condition}
                  onValueChange={(v) =>
                    updateOverride(index, {
                      condition: v as ContextOverrideCondition,
                    })
                  }
                >
                  <SelectTrigger size="sm" className="h-7 w-16 text-xs shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent sideOffset={4} portalContainer={portalContainer}>
                    <SelectItem value="eq" className="text-xs">eq</SelectItem>
                    <SelectItem value="neq" className="text-xs">neq</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  value={contextValueToInput(override.contextValue)}
                  onChange={(e) =>
                    updateOverride(index, {
                      contextValue: parseContextValue(e.target.value),
                    })
                  }
                  placeholder="Value"
                  className="h-7 text-xs w-24 shrink-0"
                  title="String, number, boolean, or JSON"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeOverride(index)}
                  aria-label="Remove override"
                >
                  ×
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Then:</span>
                <Select
                  value={
                    override.effect.type === "config"
                      ? "config"
                      : "visibility"
                  }
                  onValueChange={(v) =>
                    updateEffect(index, v === "config" ? { type: "config", configProperty: "", configValue: "" } : { type: "visibility", visible: false })
                  }
                >
                  <SelectTrigger size="sm" className="h-6 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent sideOffset={4} portalContainer={portalContainer}>
                    <SelectItem value="config" className="text-xs">Config</SelectItem>
                    <SelectItem value="visibility" className="text-xs">Visibility</SelectItem>
                  </SelectContent>
                </Select>
                {override.effect.type === "config" ? (
                  <>
                    <Input
                      type="text"
                      value={override.effect.configProperty}
                      onChange={(e) =>
                        updateEffect(index, {
                          type: "config",
                          configProperty: e.target.value,
                          configValue: override.effect.type === "config" ? override.effect.configValue : "",
                        })
                      }
                      placeholder="Config property"
                      className="h-6 w-32 text-xs"
                    />
                    <Input
                      type="text"
                      value={contextValueToInput(override.effect.configValue)}
                      onChange={(e) =>
                        updateEffect(index, {
                          type: "config",
                          configProperty: override.effect.type === "config" ? override.effect.configProperty : "",
                          configValue: parseContextValue(e.target.value),
                        })
                      }
                      placeholder="Value"
                      className="h-6 w-24 text-xs"
                    />
                  </>
                ) : (
                  <label className="flex items-center gap-1">
                    <Checkbox
                      checked={override.effect.visible}
                      onCheckedChange={(checked: boolean | "indeterminate") =>
                        updateEffect(index, { type: "visibility", visible: checked === true })
                      }
                    />
                    Visible
                  </label>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ConfigSidePanel({
  nodeId,
  onClose,
}: {
  nodeId: string;
  onClose: () => void;
}): React.ReactElement {
  const { content, schema, dispatch, portalContainer } = useEditor();
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
  const pageContextSchema = schema?.pageContextSchema;
  const pageContextKeys = pageContextSchema?.properties
    ? Object.keys(pageContextSchema.properties)
    : [];
  const availableContexts = blockType?.availableContexts ?? [];
  const contextKeys =
    availableContexts.length > 0
      ? pageContextKeys.filter((k) => availableContexts.includes(k))
      : pageContextKeys;
  const firstContextKey =
    contextKeys.length > 0 ? contextKeys[0] : undefined;

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
  const [overrides, setOverrides] = useState<ContextOverride[]>(() => {
    const raw = node?.config?.contextOverrides;
    const list = Array.isArray(raw) ? (raw as ContextOverride[]) : [];
    return firstContextKey
      ? list.map((o) => ({
          ...o,
          contextPath: o.contextPath === "" ? firstContextKey : o.contextPath,
        }))
      : list;
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
      const raw = node.config?.contextOverrides;
      const list = Array.isArray(raw) ? (raw as ContextOverride[]) : [];
      const normalized: ContextOverride[] =
        firstContextKey && list.length > 0
          ? list.map((o) => ({
              ...o,
              contextPath: (o.contextPath === "" && firstContextKey
                ? firstContextKey
                : o.contextPath) as string,
            }))
          : list;
      setOverrides(normalized);
      setJson(JSON.stringify(node.config, null, 2));
    }
  }, [nodeId, node?.config, firstContextKey]);

  if (!node) return <div />;

  const updateFormValue = (key: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveForm = () => {
    setError(null);
    const normalizedOverrides = overrides.map((o) => ({
      ...o,
      contextPath:
        o.contextPath === "" && firstContextKey
          ? firstContextKey
          : o.contextPath,
    }));
    const config = {
      ...node.config,
      ...formValues,
      contextOverrides: normalizedOverrides,
    };
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
      <SheetContent showCloseButton container={portalContainer}>
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
              <ContextOverridesSection
                overrides={overrides}
                setOverrides={setOverrides}
                contextKeys={contextKeys}
                parseContextValue={parseContextValue}
                contextValueToInput={contextValueToInput}
                defaultOverride={DEFAULT_OVERRIDE}
                portalContainer={portalContainer}
              />
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
