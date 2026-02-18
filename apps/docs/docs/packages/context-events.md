---
sidebar_position: 7
---

# @genetik/context-events

Framework-agnostic **contract and utilities** for **page context** and **events** in the Genetik render tree. This package defines types and helpers only; **@genetik/renderer-react** and **@genetik/editor-react** implement providing context via React context and forwarding events to the host.

## Installation

```bash
pnpm add @genetik/context-events
```

## Concepts

- **Context**: Namespaced mutable state (e.g. `context.forms`, `context.auth`) that the host provides and blocks can read or update. Each plugin owns a slice; the host passes `context` in the render options.
- **Events**: The page emits events (e.g. form submit) with a payload. Event names are **prefixed** (e.g. `forms:submit`). The host passes an `onEvent` callback and can route by prefix.
- **Page runtime options**: The renderer (and editor preview) accept optional `context` and `onEvent`; when present, blocks can read/update context and emit events.

## Types

| Type | Description |
|------|-------------|
| `PageContext` | Namespaced context: `Record<string, unknown>`. Each key is a namespace (e.g. `forms`, `auth`). |
| `PageEventPayload` | Payload for an event (`unknown`; host/plugins define shape per event). |
| `PageEventCallback` | `(eventName: string, payload: PageEventPayload) => void`. |
| `PageRuntimeOptions` | `{ context?: PageContext; onEvent?: PageEventCallback }`. Passed to the renderer or editor. |
| `ContextOverrideCondition` | `"eq"` \| `"neq"` — condition for a context override rule. |
| `ContextOverrideEffect` | Either `{ type: "config", configProperty, configValue }` or `{ type: "visibility", visible: boolean }`. |
| `ContextOverride` | `{ contextPath, condition, contextValue, effect }`. Stored in block config as `config.contextOverrides` (array). |

## Context overrides

Blocks can declare **context overrides** in their config: `config.contextOverrides` is an array of **ContextOverride** rules. When the page runtime provides context, the renderer applies these rules **in order**; the **last matching** override wins.

- **Condition**: For each override, the value at `contextPath` in the current context is compared to `contextValue` using `condition` (`eq` or `neq`).
- **Effect**: If the condition matches, either a **config override** (set `config[configProperty] = configValue`) or a **visibility** override (block is shown or hidden). Default visibility when no override applies is **visible** (`true`).

**Page context schema** (defined in **@genetik/schema**): The schema can define a **page context schema** with properties (type, default, editorInput) and pass it in config or register properties via a plugin. Blocks declare **availableContexts** (array of context keys from that schema) so the config panel only offers those keys in the context-override dropdown. This lets you change a block’s effective config or hide it based on context (e.g. role, feature flags, form state) without changing the block implementation.

## Utilities

All utilities are framework-agnostic (no React).

| Function | Description |
|----------|-------------|
| `getContextValue(context, path)` | Read value at dot-separated path (e.g. `"forms.values.email"`). Returns `undefined` if missing or path empty. |
| `setContextValue(context, path, value)` | Set value at path; creates nested objects as needed. Mutates context. No-op if path empty. |
| `hasContextValue(context, path)` | True if value at path is not `undefined`. |
| `createEventEmitter(onEvent)` | Returns a function `(eventName, payload) => void` that calls `onEvent` or no-ops if `onEvent` is undefined. |
| `applyContextOverrides(rawConfig, context)` | Computes effective config and visibility from `rawConfig.contextOverrides` and current `context`. Returns `{ config, visible }`. |

## Usage example

```ts
import {
  getContextValue,
  setContextValue,
  createEventEmitter,
  type PageContext,
  type PageRuntimeOptions,
} from "@genetik/context-events";

const context: PageContext = { forms: { values: {} } };

setContextValue(context, "forms.values.email", "a@b.com");
getContextValue(context, "forms.values.email"); // "a@b.com"

const onEvent = (name: string, payload: unknown) => {
  if (name === "forms:submit") {
    // persist or navigate
  }
};
const emit = createEventEmitter(onEvent);
emit("forms:submit", context);

const options: PageRuntimeOptions = { context, onEvent };
// Pass as fourth argument to renderContent in @genetik/renderer-react.
```

## Integration with the renderer

**@genetik/renderer-react** accepts an optional fourth argument to `renderContent`: `RenderContentOptions` (`context`, `onContextUpdate`, `onEvent`). When provided, the tree is wrapped in `PageRuntimeProvider` and each block is wrapped so it receives **context**, **updateContext**, and **emit** in props, and so **context overrides** (from `config.contextOverrides`) are applied to effective config and visibility. The editor uses the same options for preview and provides a **Context overrides** section in the block config panel to add or edit override rules.

## Conventions

- **Context**: Namespaced slices (`context.forms`, `context.auth`) to avoid collisions between plugins.
- **Events**: Prefixed names (`forms:submit`) so the host can route by plugin.

## API summary

| Export | Description |
|--------|-------------|
| `getContextValue`, `setContextValue`, `hasContextValue` | Path-based context read/write and presence check. |
| `createEventEmitter` | Returns an emit function that calls the host's `onEvent` or no-ops. |
| `applyContextOverrides` | Applies `config.contextOverrides` to get effective config and visibility. |
| `PageContext`, `PageEventPayload`, `PageEventCallback`, `PageRuntimeOptions` | Types for the page runtime contract. |
| `ContextOverride`, `ContextOverrideCondition`, `ContextOverrideEffect` | Types for context override rules in block config. |

## Package location and build

Source: `packages/context-events` in the monorepo. Built with [tsdown](https://tsdown.dev/). Run `pnpm --filter @genetik/context-events build` from the repo root.
