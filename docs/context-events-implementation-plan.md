# @genetik/context-events — Implementation plan

Implementation plan for the **framework-agnostic** context and events package. See [context-and-events-plan.md](./context-and-events-plan.md) for architecture and decisions.

---

## 1. Package scope

- **Name**: `@genetik/context-events`
- **Role**: Define the contract (types, options) and framework-agnostic utilities for page context and events. No React, no DOM.
- **Consumers**: renderer-react, editor-react (they implement the contract with React context); @genetik/forms (extends with forms-specific contracts).
- **Dependencies**: None for v1. Pure types + small utilities. If we later add context-schema validation we may depend on `@genetik/schema`.

---

## 2. Public API

### 2.1 Types

| Type | Description |
|------|-------------|
| `PageContext` | Namespaced context object. Type: `Record<string, unknown>` (each key is a namespace, e.g. `forms`, `auth`). Plugins and host agree on the shape per namespace. |
| `PageEventPayload` | Payload for an event. Type: `unknown` (host/plugins define per event name). |
| `PageEventCallback` | Callback invoked when the page emits an event. Type: `(eventName: string, payload: PageEventPayload) => void`. Event names are prefixed (e.g. `forms:submit`). |
| `PageRuntimeOptions` | Options passed to the renderer (or editor) for context and events. Type: `{ context?: PageContext; onEvent?: PageEventCallback }`. |
| `ContextPath` | Optional: type for a path into context (e.g. `"forms"`, `"forms.values.email"`) for utilities. Can be `string` for v1. |

### 2.2 Utilities (framework-agnostic)

| Function | Signature | Description |
|----------|-----------|-------------|
| `getContextValue` | `(context: PageContext, path: string) => unknown` | Read a value from context by path. Path is dot-separated (e.g. `"forms.values.email"`). Returns `undefined` if path is missing. |
| `setContextValue` | `(context: PageContext, path: string, value: unknown) => void` | Set a value at path. Mutates `context`; creates nested objects as needed. For immutable updates, the host is responsible for cloning (utilities only support in-place mutation for simplicity in v1). |
| `hasContextValue` | `(context: PageContext, path: string) => boolean` | True if a value exists at path (and is not `undefined`). |
| `createEventEmitter` | `(onEvent: PageEventCallback \| undefined) => (eventName: string, payload: PageEventPayload) => void` | Returns a function that calls `onEvent` when invoked, or a no-op if `onEvent` is undefined. Lets blocks/plugins call `emit(eventName, payload)` without checking for `onEvent`. |

Optional for v1: immutable `updateContext(context, path, value) => PageContext` (clone and set). Can be added if the host/renderer needs immutability.

### 2.3 Exports

- All types and utilities above.
- No default export; named exports only.

---

## 3. Implementation phases

### Phase 1: Package scaffold and types

1. **Create package** under `packages/context-events/`.
   - `package.json`: name `@genetik/context-events`, version `0.0.1`, type module, main/module/types exports, files `["dist"]`, scripts: build (tsdown), dev, lint, check-types. No dependencies. devDependencies: @genetik/eslint-config, @genetik/typescript-config, tsdown, typescript. engines node >= 18. publishConfig access public.
   - `tsconfig.json`: extend @genetik/typescript-config (base or react-library without JSX if available; else base), compilerOptions outDir dist, rootDir src.
   - `tsdown.config.ts` (or use default): ESM + CJS + types, entry `src/index.ts`.
   - `.eslintrc` or use repo eslint config for the package.

2. **Add types** in `src/types.ts`.
   - `PageContext = Record<string, unknown>`.
   - `PageEventPayload = unknown`.
   - `PageEventCallback = (eventName: string, payload: PageEventPayload) => void`.
   - `PageRuntimeOptions = { context?: PageContext; onEvent?: PageEventCallback }`.

3. **Barrel** `src/index.ts`: export types from `./types`, export utilities from `./utils` (phase 2).

4. **Build and lint**: `pnpm build`, `pnpm check-types`, `pnpm lint` from package dir. Fix any config issues.

### Phase 2: Utilities

1. **Implement** in `src/utils.ts` (or `get.ts` / `set.ts` if preferred):
   - `getContextValue(context, path)`: split path by `.`, traverse context, return value or `undefined`.
   - `setContextValue(context, path, value)`: split path, create nested objects as needed, set last key to value. Mutates context.
   - `hasContextValue(context, path)`: get value at path, return value !== undefined (or use `in` for last segment if we want to distinguish “missing” from “set to undefined”).
   - `createEventEmitter(onEvent)`: return `(eventName, payload) => { onEvent?.(eventName, payload); }`.

2. **Export** from `src/index.ts`.

3. **Edge cases**: empty path, single segment, numeric segments (treat as keys; no array indexing in v1 unless we need it).

### Phase 3: Tests

1. **Vitest** in `packages/context-events`: add `vitest.config.ts`, devDependency `vitest`.
2. **Tests** in `src/utils.test.ts` (and optionally `types` if we add branded types later):
   - `getContextValue`: existing key, nested path, missing path, empty path.
   - `setContextValue`: set top-level, set nested (creates objects), set deep.
   - `hasContextValue`: existing, missing, undefined value.
   - `createEventEmitter`: with callback (invoked with name and payload), without callback (no throw).
3. **Run**: `pnpm test` from package. Ensure CI runs this package’s tests.

### Phase 4: Documentation and integration prep

1. **README**: Package purpose, API summary (types + utilities), minimal example (construct options, get/set context, createEventEmitter). Note that React integration is in renderer-react/editor-react.
2. **Docs site**: Add or update a page under `apps/docs/docs/packages/` for @genetik/context-events (concepts, types, utilities, how renderer-react uses it).
3. **Renderer/renderer-react**: In a **separate** PR or follow-up, add `PageRuntimeOptions` to the renderer (and renderer-react) so they accept `context` and `onEvent`. Renderer-react will implement providing context via React context and forwarding the event callback. This plan does not implement that; it only delivers the package so the renderer can depend on it.

---

## 4. File layout

```
packages/context-events/
  package.json
  tsconfig.json
  tsdown.config.ts
  eslint.config.mjs (or inherited)
  src/
    index.ts      # re-export types + utils
    types.ts      # PageContext, PageEventCallback, PageRuntimeOptions, PageEventPayload
    utils.ts      # getContextValue, setContextValue, hasContextValue, createEventEmitter
    utils.test.ts
  README.md
```

---

## 5. Out of scope for this package (v1)

- Context **schema** (definition or validation): will be defined by plugins when we integrate with `createSchema`; this package only defines the runtime shape (`Record<string, unknown>`).
- **Immutable** context updates: utilities mutate in place; host can clone before passing if needed.
- **React** context or hooks: implemented in renderer-react and editor-react.
- **Events** as a first-class subscription model (e.g. multiple listeners): the contract is a single `onEvent` callback; the host can fan out if needed.

---

## 6. Checklist

- [ ] Phase 1: Package scaffold, types, barrel, build/lint
- [ ] Phase 2: Utilities (get, set, has, createEventEmitter)
- [ ] Phase 3: Tests for utilities
- [ ] Phase 4: README, docs page, (optional) renderer integration prep notes
- [ ] Way of working: run tests, lint, check-types; update docs
