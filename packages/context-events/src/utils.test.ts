import { describe, expect, it, vi } from "vitest";
import {
  applyContextOverrides,
  createEventEmitter,
  getContextValue,
  hasContextValue,
  setContextValue,
} from "./utils.js";

describe("getContextValue", () => {
  it("returns value at top-level key", () => {
    const context = { forms: { email: "a@b.com" } };
    expect(getContextValue(context, "forms")).toEqual({ email: "a@b.com" });
  });

  it("returns value at nested path", () => {
    const context = { forms: { values: { email: "a@b.com" } } };
    expect(getContextValue(context, "forms.values.email")).toBe("a@b.com");
  });

  it("returns undefined for missing path", () => {
    const context = { forms: {} };
    expect(getContextValue(context, "forms.missing")).toBeUndefined();
    expect(getContextValue(context, "auth")).toBeUndefined();
  });

  it("returns undefined for empty path", () => {
    const context = { forms: {} };
    expect(getContextValue(context, "")).toBeUndefined();
    expect(getContextValue(context, "   ")).toBeUndefined();
  });

  it("returns undefined when traversing through non-object", () => {
    const context = { forms: "not-an-object" };
    expect(getContextValue(context, "forms.values.email")).toBeUndefined();
  });
});

describe("setContextValue", () => {
  it("sets top-level key", () => {
    const context: Record<string, unknown> = {};
    setContextValue(context, "forms", { email: "a@b.com" });
    expect(context.forms).toEqual({ email: "a@b.com" });
  });

  it("sets nested path and creates objects", () => {
    const context: Record<string, unknown> = {};
    setContextValue(context, "forms.values.email", "a@b.com");
    expect(context).toEqual({
      forms: { values: { email: "a@b.com" } },
    });
  });

  it("sets deep path", () => {
    const context: Record<string, unknown> = { forms: {} };
    setContextValue(context, "forms.a.b.c", 1);
    expect(context.forms).toEqual({ a: { b: { c: 1 } } });
  });

  it("is no-op for empty path", () => {
    const context: Record<string, unknown> = {};
    setContextValue(context, "", "x");
    setContextValue(context, "   ", "x");
    expect(context).toEqual({});
  });

  it("overwrites existing value at path", () => {
    const context: Record<string, unknown> = { forms: { email: "old" } };
    setContextValue(context, "forms.email", "new");
    expect(context.forms).toEqual({ email: "new" });
  });
});

describe("hasContextValue", () => {
  it("returns true when value exists", () => {
    const context = { forms: { email: "a@b.com" } };
    expect(hasContextValue(context, "forms")).toBe(true);
    expect(hasContextValue(context, "forms.email")).toBe(true);
  });

  it("returns false when path is missing", () => {
    const context = { forms: {} };
    expect(hasContextValue(context, "forms.missing")).toBe(false);
    expect(hasContextValue(context, "auth")).toBe(false);
  });

  it("returns false when value is undefined", () => {
    const context = { forms: { email: undefined } };
    expect(hasContextValue(context, "forms.email")).toBe(false);
  });
});

describe("applyContextOverrides", () => {
  it("returns base config and visible true when no overrides", () => {
    const raw = { title: "Hi", content: "Hello" };
    const result = applyContextOverrides(raw, {});
    expect(result.config).toEqual({ title: "Hi", content: "Hello" });
    expect(result.visible).toBe(true);
  });

  it("strips contextOverrides from config", () => {
    const raw = { title: "Hi", contextOverrides: [] };
    const result = applyContextOverrides(raw, {});
    expect(result.config).toEqual({ title: "Hi" });
    expect(result.config.contextOverrides).toBeUndefined();
  });

  it("applies visibility override when context matches (eq)", () => {
    const raw = {
      title: "Hi",
      contextOverrides: [
        {
          contextPath: "flag",
          condition: "eq" as const,
          contextValue: true,
          effect: { type: "visibility" as const, visible: false },
        },
      ],
    };
    const result = applyContextOverrides(raw, { flag: true });
    expect(result.visible).toBe(false);
    expect(result.config.title).toBe("Hi");
  });

  it("applies config override when context matches (eq)", () => {
    const raw = {
      variant: "default",
      contextOverrides: [
        {
          contextPath: "theme",
          condition: "eq" as const,
          contextValue: "dark",
          effect: { type: "config" as const, configProperty: "variant", configValue: "inverted" },
        },
      ],
    };
    const result = applyContextOverrides(raw, { theme: "dark" });
    expect(result.config.variant).toBe("inverted");
    expect(result.visible).toBe(true);
  });

  it("last matching override wins", () => {
    const raw = {
      title: "Hi",
      contextOverrides: [
        { contextPath: "x", condition: "eq" as const, contextValue: 1, effect: { type: "visibility" as const, visible: false } },
        { contextPath: "x", condition: "eq" as const, contextValue: 1, effect: { type: "visibility" as const, visible: true } },
      ],
    };
    const result = applyContextOverrides(raw, { x: 1 });
    expect(result.visible).toBe(true);
  });

  it("no match leaves visibility true", () => {
    const raw = {
      contextOverrides: [
        { contextPath: "flag", condition: "eq" as const, contextValue: true, effect: { type: "visibility" as const, visible: false } },
      ],
    };
    const result = applyContextOverrides(raw, { flag: false });
    expect(result.visible).toBe(true);
  });

  it("neq condition matches when value differs", () => {
    const raw = {
      contextOverrides: [
        { contextPath: "role", condition: "neq" as const, contextValue: "admin", effect: { type: "visibility" as const, visible: false } },
      ],
    };
    const result = applyContextOverrides(raw, { role: "user" });
    expect(result.visible).toBe(false);
  });
});

describe("createEventEmitter", () => {
  it("invokes onEvent with event name and payload when provided", () => {
    const onEvent = vi.fn();
    const emit = createEventEmitter(onEvent);
    emit("forms:submit", { email: "a@b.com" });
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith("forms:submit", { email: "a@b.com" });
  });

  it("does not throw when onEvent is undefined", () => {
    const emit = createEventEmitter(undefined);
    expect(() => emit("forms:submit", {})).not.toThrow();
  });
});
