# Page context and events — Architecture plan

Plan for **context** and **events** in the rendered page: runtime state (e.g. form state) available to blocks, and events (e.g. form submit) emitted to the parent with that context as payload. Optional: editor uses context to conditionally show blocks or variants.

**Implementation**: See [context-events-implementation-plan.md](./context-events-implementation-plan.md) for the plan to implement the single @genetik/context-events package.

---

## 1. Goals

- **Context**: Mutable state available to all components in the rendered tree (e.g. form values). Plugins (e.g. a forms plugin) can provide and consume this context.
- **Events**: The page can emit events (e.g. `formSubmit`) with a payload (e.g. form state). **Parents of the renderer** receive these via callbacks; they are not part of the content/schema.
- **Forms plugin**: Stores form state in context; form blocks read/write it. On submit, triggers an event with that context so the host can persist or navigate.
- **Editor (optional)**: Block config or block choice can depend on context—e.g. “if `someContext` is true, render this block (or variant), else another.” Enables conditional UIs and A/B-style variants without duplicating content.

---

## 2. Concepts

| Concept | Owner | Consumers |
|--------|--------|-----------|
| **Context** | Provided by the host (or a plugin that wraps the renderer). Typed key/value store (e.g. `{ formState: {...} }`). | Block components in the tree, optionally the resolver (for conditional blocks). |
| **Events** | Emitted by blocks or by plugins (e.g. form submit handler). | Host via callbacks (e.g. `onFormSubmit(payload)`). |
| **Context in editor** | Same context abstraction; in edit mode the host might inject “preview” context so conditional blocks render correctly. | Resolver/renderer when resolving “which block/variant to show” from config + context. |

**Conventions (resolved)**  
- **Context** is **namespaced** (e.g. `context.forms`, `context.auth`) so plugins don't collide.  
- **Events** are **prefixed** (e.g. `forms:submit`) so the host can route by plugin.  
- **Context schema** is defined or extended by plugins in `createSchema`; block config can reference context properties for conditional display, and the config panel uses that schema.

**Data flow**

- **Render path**: Host passes `content`, `schema`, `componentMap`, and optionally `context` (and `onEvent`). Renderer resolves the tree; block components can read `context` (e.g. via React context or a prop). When something triggers an event (e.g. submit), the renderer or plugin calls `onEvent(name, payload)`; the host handles it.
- **Editor path**: When config or schema says “block X depends on context key K,” the resolver (or a small layer) reads `context` and chooses which node to render or which variant (e.g. which slot or which block type). The editor might run the same resolver with “preview context” so authors see the right branch.

---

## 3. Architecture options

### Option A: Standalone plugin package (@genetik/context-events)

A dedicated package that defines:

- **Context type**: A generic store (e.g. `Record<string, unknown>` or a typed map) and a **React context** (or similar) to provide it.
- **Event type**: Event name + payload; a way to emit (e.g. `emitEvent(name, payload)`) and subscribe (e.g. `onEvent` callback passed from the host).
- **Renderer integration**: The **host** wraps the tree in the context provider and passes an event callback. The **renderer** (e.g. @genetik/renderer-react) does **not** depend on this package; it just renders. Block components (or a thin “page shell” provided by the host or forms plugin) pull context and call `emitEvent`.

**Forms plugin**: Depends on @genetik/context-events. Provides a “form context” slice (e.g. `context.formState`) and form block components that read/write it. On submit, calls `emitEvent('formSubmit', context)` (or a typed variant). Host passes `onEvent` and stores context in state if needed.

**Editor**: Editor does **not** depend on context-events. Conditional blocks could be implemented later by having the **resolver** accept an optional `context` and a schema extension like “show this block when context.x === value.” That resolver would live in the renderer (or a small optional package) and would read context at resolve time.

**Pros**

- **Modular**: Renderer and editor stay framework-agnostic and unaware of context/events. No new core dependencies.
- **Clear boundary**: Context and events are a “page runtime” feature; the host composes them with the renderer.
- **Pluggable**: Multiple plugins can contribute context slices and event types without touching core.

**Cons**

- **Two systems**: Host must wire context + event callback into the render tree manually. Slightly more boilerplate.
- **Conditional blocks**: Require a separate design (resolver + schema extension) and possibly a small optional package (e.g. @genetik/renderer-context or an option on the renderer) that knows about context for resolution.

---

### Option B: Integrated into renderer (and optionally editor)

The **renderer** (and renderer-react) own context and events:

- **Renderer-react**: `renderContent(content, schema, componentMap, options?)` where `options` includes `context`, `onEvent`, and maybe `contextRef` (for plugins to mutate). The renderer wraps the tree in an internal context provider and passes a callback so blocks (or a page-level component) can emit events.
- **Block components**: Receive `context` (and maybe `emitEvent`) as part of **BlockProps** or via a separate hook (e.g. `usePageContext()`). No separate package for “context + events”; it’s part of the renderer contract.

**Forms plugin**: Depends on @genetik/renderer-react (or a shared types package). Uses the same `context` and `emitEvent` from the renderer. Registers form block types and provides the form-state slice in context (host or plugin sets initial context and passes it in).

**Editor**: Editor (or editor-react) can pass “preview context” into the preview renderer so conditional blocks resolve correctly. Config UI could allow editing that preview context (e.g. “preview as: logged-in user”).

**Pros**

- **Single integration point**: One API for the host: pass `context` and `onEvent` to the renderer. Blocks get them automatically.
- **Conditional blocks**: Easier to add inside the same resolver: resolver already has access to `context` when resolving which block or variant to show.

**Cons**

- **Less modular**: Renderer (and possibly editor) take a dependency on “context + events” as a concept. Framework-agnostic core might need a minimal abstraction (e.g. “context reader” interface) so the React binding provides the implementation.
- **Scope creep**: Renderer’s responsibility grows; plugins that only need context still depend on the full renderer.

---

### Option C: Hybrid — framework-agnostic contract, React bindings in renderer/editor

- **@genetik/context-events** (or similar): **Framework-agnostic** package. Defines only **contracts and options**:
  - **Types**: e.g. `PageContext` (shape of context), `PageEventCallback`, `RenderOptions` (context + onEvent).
  - **Utilities**: Agnostic helpers for reading/updating context (e.g. `getContextValue(context, path)`, `updateContext(context, path, value)` or a small store interface) — no React, no DOM. These can be used by any consumer (resolver, plugins, or a future non-React binding).
  - **No React**: This package does **not** implement React context or hooks. It is the single source of truth for the *contract* and for framework-agnostic context/event utilities.
- **renderer-react / editor-react**: **Implement** the contract using React. They accept the same options (context, onEvent) and are responsible for providing context to the tree via **React context** (provider + hook or prop injection). They depend on @genetik/context-events for types and utilities; they own the React-specific wiring.
- **@genetik/forms**: **Extends** the context package. Defines **forms-specific contracts**: e.g. form state shape, form event names and payloads, and any utilities for form context (again framework-agnostic). Depends on @genetik/context-events. A **forms-react** (or form blocks inside an app) would use renderer-react’s context implementation to read/write the forms slice and emit form events.

**Pros**

- **Clear separation**: Context/events contract and utilities live in one framework-agnostic package; React is only in the bindings (renderer-react, editor-react).
- **Reusable utilities**: Get/update context can be used in resolver (conditional blocks), in plugins, or in a future Vue/Svelte binding without pulling in React.
- **Forms as extension**: @genetik/forms stays focused on forms-specific types and events; it composes with the generic context contract instead of redefining it.

**Cons**

- **Two packages to coordinate**: Contract package vs. React bindings; versioning and docs must stay in sync.

---

## 4. Conditional blocks and editor

**Idea**: A block’s **config** (or a schema-level extension) can specify a condition on context, e.g. “show when `context.loggedIn === true`.” The **resolver** (in renderer core or an extension) evaluates that condition and either:

- Renders this node as usual, or
- Renders an alternative block / variant, or
- Skips the node (or renders a fallback).

**Context schema and block config**  
The **context schema** (defined or extended by plugins when calling `createSchema`) describes which context keys exist and their types. For conditional rendering, a block’s **config** can reference those context properties (e.g. “show when `context.auth.loggedIn` is true”). The **config panel** for that block is driven by the context schema so authors can pick valid context paths and values. So: plugins define the context schema; block config holds the condition; the resolver evaluates it at render time; the editor’s config UI lets authors set the condition using the same schema.

**Editor**

- **Preview context**: Editor passes a **preview context** (e.g. `{ loggedIn: true }`) into the preview renderer so authors see the right branch. Config panel could expose “Preview context” (key/value) for development.
- **Config depending on context**: Blocks whose config schema references “context-driven” fields (e.g. “variant: A | B, chosen by context”) could show a selector in the editor that both edits config and simulates context for preview.

**Where it lives**

- **Option A**: Conditional resolution in a small package (e.g. @genetik/renderer-context) that wraps or extends the resolver and depends on the same context type as the standalone context-events package.
- **Option B**: Conditional resolution inside the renderer, which already has context.
- **Option C**: Same as A; the “minimal core” only defines the context/event types; a plugin or a small renderer extension does the conditional resolution using those types.

---

## 5. Package layering (Option C refined)

| Layer | Package | Role |
|-------|---------|------|
| **Contract** | **@genetik/context-events** | Framework-agnostic. Types: `PageContext`, `PageEventCallback`, `RenderOptions`. Utilities: get/update context (no React). Defines how context and events are passed (options) and how they can be read/updated in code. |
| **React implementation** | **@genetik/renderer-react** | Accepts options from context-events; provides context to the rendered tree via **React context** (provider + hook or props). Uses context-events types and utilities. |
| **React implementation** | **@genetik/editor-react** | Same: when rendering preview (or editable blocks that depend on context), uses the same options and implements consumption via React context. |
| **Extension** | **@genetik/forms** | Extends context-events. Defines **forms-specific** contracts: form state shape, form event names/payloads, and any form-specific context utilities. No React; forms UI (e.g. form block components) uses the context provided by renderer-react and the event callback to submit. |

So: **context-events** = contract + agnostic utilities; **renderer-react / editor-react** = React context implementation; **forms** = forms-specific contract building on context-events.

### One package vs two (context and events)

**One package (@genetik/context-events)**  
- Context and events are the two sides of the same “page runtime” contract: state in (context), notifications out (events). The renderer and host always deal with both (e.g. `RenderOptions` has `context` and `onEvent`).
- Single dependency for consumers (renderer-react, forms); one version to keep in sync.
- Simpler: no need for a shared “options” type that imports from two packages, or for one package to re-export the other.

**Two packages (@genetik/context + @genetik/events)**  
- Theoretically more modular: something could depend only on context (read-only state) or only on events (e.g. fire-and-forget analytics) without the other.
- In practice, the renderer and most plugins need both; splitting would mean either two deps everywhere or a thin “runtime” package that composes them, which is close to “one package” again.
- Versioning and types become trickier: `RenderOptions` would live in one place and reference both, or you’d have a third “types” package.

**Recommendation: one package.** Context and events are used together as the page-runtime contract. One package keeps the dependency graph and API surface simple; if a future use case needs “events only” or “context only,” that can be a separate minimal dependency later.
---

## 6. Summary and recommendation

| Criterion | Option A (standalone) | Option B (integrated) | Option C (hybrid) |
|-----------|------------------------|------------------------|-------------------|
| **Modularity** | High: no renderer/editor dependency on context/events | Lower: renderer owns the feature | High: core only defines contract |
| **Host boilerplate** | More: wire provider + callback yourself | Less: one render call with options | Medium: plugin gives provider, host passes options |
| **Conditional blocks** | Separate package or renderer extension | Natural fit in same resolver | Extension or small package |
| **Forms plugin** | Uses standalone context-events | Uses renderer’s context/events | Uses plugin impl + shared types |
| **Risk** | Slightly fragmented | Renderer scope creep | Two packages to keep in sync |

**Recommendation: Option C (refined)**

- **@genetik/context-events**: Framework-agnostic package defining contracts (types, options) and utilities (get/update context, no React). Renderer and editor *options* reference these types.
- **renderer-react / editor-react**: Implement context using **React context** (provider + consumption). They depend on @genetik/context-events for the contract and use its utilities where needed; they do not ship a separate “context implementation” package.
- **@genetik/forms**: Extends the context contract with **forms-specific** types and event contracts (form state shape, form submit event payload, etc.). Framework-agnostic. Forms UI (blocks, hooks) in an app or a forms-react layer would use the context provided by renderer-react to read/write form state and emit form events.
- **Short term**: Introduce @genetik/context-events and add `context` + `onEvent` to renderer (and renderer-react) options; implement React context in renderer-react. Build @genetik/forms on top with forms-specific contracts; no editor change initially.
- **Later**: Conditional blocks (resolver reads context via the same utilities); editor gains “preview context” and uses the same options when rendering preview.

This keeps the core modular and framework-agnostic, gives forms a clear extension point, and leaves conditional blocks and editor preview as natural next steps.

---

## 7. Resolved design choices

- **Context shape**: **Namespaced slices** (e.g. `context.forms`, `context.auth`). Namespacing avoids collisions between plugins; each plugin owns a slice.
- **Event naming**: **Prefixed** (e.g. `forms:submit`). Prefixed events help when multiple plugins emit events; the host can route by prefix.
- **Editor preview context**: **Stored in editor state**. The editor holds the preview context (e.g. key/value) so authors can change it and see conditional branches update; no need to derive from URL or a separate dropdown for v1.
- **Schema for context and conditions**:
  - **Context schema**: When passing a plugin to `createSchema`, that plugin can define (or extend) a **schema for the context** — i.e. what keys and types the context has (e.g. `forms`, `auth`). Additional plugins extend that schema, so the overall context shape is typed and known to the system.
  - **Conditional rendering**: Once a context property is defined in the schema (via a plugin), blocks can reference it for **conditional display**. In the **config panel for a specific block**, authors can configure conditions that reference those context properties (e.g. “show when `context.auth.loggedIn` is true”). So: schema defines what context exists; block config references those properties for conditions, and the config UI is driven by the context schema so authors pick from valid paths.
