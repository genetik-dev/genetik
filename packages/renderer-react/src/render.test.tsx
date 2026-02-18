import { describe, it, expect } from "vitest";
import { createElement, isValidElement, type ComponentType, type ReactElement } from "react";
import { render, screen, act } from "@testing-library/react";
import { createSchema } from "@genetik/schema";
import { renderContent } from "./render.jsx";
import type { GenetikContent } from "@genetik/content";
import type { BlockProps } from "./types.js";
import type { BlockInput } from "@genetik/schema";

const textBlock: BlockInput = {
  id: "text",
  configSchema: { type: "object", properties: { content: { type: "string" } } },
  slots: [],
};

const cardBlock: BlockInput = {
  id: "card",
  configSchema: { type: "object", properties: { title: { type: "string" } } },
  slots: [{ name: "children", multiple: true }],
};

const schema = createSchema({ blocks: [textBlock, cardBlock] });

function TextBlock({ config }: BlockProps) {
  return createElement("span", null, (config as { content?: string }).content ?? "");
}

function CardBlock({ config, slots }: BlockProps) {
  const title = (config as { title?: string }).title ?? "";
  return createElement(
    "div",
    { "data-testid": "card" },
    title,
    createElement("div", { "data-testid": "card-children" }, slots.children ?? [])
  );
}

const componentMap: Record<string, ComponentType<BlockProps>> = {
  text: TextBlock,
  card: CardBlock,
};

describe("renderContent", () => {
  it("returns null when entry node is missing", () => {
    const content: GenetikContent = {
      entryId: "missing",
      nodes: {
        root: { id: "root", block: "text", config: { content: "Hi" } },
      },
    };
    const result = renderContent(content, schema, componentMap);
    expect(result).toBeNull();
  });

  it("returns a React element for valid content and matching component map", () => {
    const content: GenetikContent = {
      entryId: "root",
      nodes: {
        root: { id: "root", block: "text", config: { content: "Hello" } },
      },
    };
    const result = renderContent(content, schema, componentMap);
    expect(result).not.toBeNull();
    expect(isValidElement(result)).toBe(true);
  });

  it("returns null for unknown block type when no component is mapped", () => {
    const content: GenetikContent = {
      entryId: "root",
      nodes: {
        root: { id: "root", block: "unknown", config: {} },
      },
    };
    const result = renderContent(content, schema, componentMap);
    expect(result).toBeNull();
  });

  it("accepts a JSON string and parses it before rendering", () => {
    const json = JSON.stringify({
      entryId: "root",
      nodes: { root: { id: "root", block: "text", config: { content: "From JSON" } } },
    });
    const result = renderContent(json, schema, componentMap);
    expect(result).not.toBeNull();
    expect(isValidElement(result)).toBe(true);
  });

  it("returns null when content is invalid JSON string", () => {
    const result = renderContent("not json", schema, componentMap);
    expect(result).toBeNull();
  });

  it("renders a single text block (React Testing Library)", () => {
    const content: GenetikContent = {
      entryId: "root",
      nodes: {
        root: { id: "root", block: "text", config: { content: "Hello" } },
      },
    };
    const result = renderContent(content, schema, componentMap);
    expect(result).not.toBeNull();
    act(() => {
      render(result as ReactElement);
    });
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders card with children slots (React Testing Library)", () => {
    const content: GenetikContent = {
      entryId: "card1",
      nodes: {
        card1: {
          id: "card1",
          block: "card",
          config: { title: "My Card" },
          children: ["a", "b"],
        },
        a: { id: "a", block: "text", config: { content: "A" } },
        b: { id: "b", block: "text", config: { content: "B" } },
      },
    };
    const result = renderContent(content, schema, componentMap);
    expect(result).not.toBeNull();
    act(() => {
      render(result as ReactElement);
    });
    expect(screen.getByTestId("card")).toBeInTheDocument();
    expect(screen.getByTestId("card")).toHaveTextContent("My Card");
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("wraps tree in PageRuntimeProvider and applies context overrides when options.context is passed", () => {
    const content: GenetikContent = {
      entryId: "root",
      nodes: {
        root: {
          id: "root",
          block: "text",
          config: {
            content: "Hidden when flag is true",
            contextOverrides: [
              {
                contextPath: "flag",
                condition: "eq",
                contextValue: true,
                effect: { type: "visibility", visible: false },
              },
            ],
          },
        },
      },
    };
    const result = renderContent(content, schema, componentMap, {
      context: { flag: true },
    });
    expect(result).not.toBeNull();
    act(() => {
      render(result as ReactElement);
    });
    expect(screen.queryByText("Hidden when flag is true")).not.toBeInTheDocument();
  });

  it("shows block when context does not match override", () => {
    const content: GenetikContent = {
      entryId: "root",
      nodes: {
        root: {
          id: "root",
          block: "text",
          config: {
            content: "Visible when flag is false",
            contextOverrides: [
              {
                contextPath: "flag",
                condition: "eq",
                contextValue: true,
                effect: { type: "visibility", visible: false },
              },
            ],
          },
        },
      },
    };
    const result = renderContent(content, schema, componentMap, {
      context: { flag: false },
    });
    expect(result).not.toBeNull();
    act(() => {
      render(result as ReactElement);
    });
    expect(screen.getByText("Visible when flag is false")).toBeInTheDocument();
  });
});
