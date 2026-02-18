# @genetik/context-events

Framework-agnostic **contract and utilities** for page context and events in the Genetik render tree. Context is namespaced state (e.g. `context.forms`, `context.auth`) that blocks can read and update; events are emitted to the host with a payload (e.g. `forms:submit`). **React integration** (providing context via React context, consuming in blocks) lives in **@genetik/renderer-react** and **@genetik/editor-react**; this package defines only types and utilities.

## Installation

```bash
pnpm add @genetik/context-events
```

## API summary

**Types**

- `PageContext` — Namespaced context object (`Record<string, unknown>`).
- `PageEventPayload` — Event payload (`unknown`).
- `PageEventCallback` — `(eventName: string, payload: PageEventPayload) => void`.
- `PageRuntimeOptions` — `{ context?: PageContext; onEvent?: PageEventCallback }` (passed to renderer/editor).

**Utilities**

- `getContextValue(context, path)` — Read value at dot-separated path (e.g. `"forms.values.email"`). Returns `undefined` if missing or path empty.
- `setContextValue(context, path, value)` — Set value at path; creates nested objects. Mutates context. No-op if path empty.
- `hasContextValue(context, path)` — True if value at path is not `undefined`.
- `createEventEmitter(onEvent)` — Returns `(eventName, payload) => void` that calls `onEvent` or no-ops if `onEvent` is undefined.

## Minimal example

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
  console.log(name, payload);
};
const emit = createEventEmitter(onEvent);
emit("forms:submit", context);

const options: PageRuntimeOptions = { context, onEvent };
// Pass options to the renderer (e.g. renderer-react) so the tree can use context and emit events.
```

## Conventions

- **Context** is namespaced (e.g. `context.forms`, `context.auth`) so plugins don't collide.
- **Events** are prefixed (e.g. `forms:submit`). The host can route by prefix.

## See also

- Architecture and implementation plans are in the repo under `docs/` (context-and-events-plan.md, context-events-implementation-plan.md).
- Docs site: [@genetik/context-events](/docs/packages/context-events) — concepts and integration with the renderer.
