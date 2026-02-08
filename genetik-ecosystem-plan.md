# @genetik Ecosystem — Architecture Plan (Draft)

A JSON-driven UI ecosystem: schema-defined blocks, flat content trees, and a plugin-based renderer for CMS, LLM-driven UIs, and dynamic applications.

---

## 1. Vision & Goals

- **JSON as source of truth**: UI structure and configuration live in data, not only in code.
- **Schema-first**: A single schema defines what's allowed; it drives validation, tooling, and rendering.
- **Flat content model**: Content is a flat map of nodes by id + one entry id; slots reference children by id. Easy to patch, merge, and reason about.
- **Pluggable**: Blocks and capabilities are extended via a clear plugin/schema-extension model.
- **Multi-consumer**: Same content model can serve CMS editors, LLM-generated UIs, headless CMS APIs, and static site generation.

---

## 2. Core Data Model (Conceptual)

### 2.1 Schema

- **Block types**: Named block definitions (e.g. `hero`, `card`, `text`, `grid`, `form-field`).
- **Per-block config schema**: What configuration each block accepts (e.g. title, image url, layout variant). **JSON Schema** per block type — standard, tooling-rich, validatable.
- **Slots**: For each block type, which slots exist (e.g. `children`, `header`, `footer`) and whether each accepts a single node or an ordered list. **Reference mode** is a **global schema option** (not per-slot):
  - **id**: slot value is an id or array of ids (references into the node map). Canonical form.
  - **inline**: slot may also contain inline node(s) — nested structure that gets **normalized** to flat + generated ids before storage/rendering.
  - **both**: slot accepts either id(s) or inline node(s).
  - The schema has one setting (e.g. `slotReferenceMode`) that applies to all slots: **id only**, **inline only**, or **both**.
- **Plugins**: Extensions that register new block types (and possibly new config shapes or validation rules).

### 2.2 Content (JSON definition)

- **Canonical form (stored / rendered)**: **Entry id** + **flat node map** (`nodeId → node`). Each node has `id`, `block`, `config`, and slot values that are **ids or arrays of ids** (e.g. `children: ["id-1", "id-2"]`). No nesting — only references by id.
- **Input form (when schema allows inline)**: A slot may instead contain **inline node(s)** — e.g. a single node object or an array of node objects (with optional nested slots). Valid only when the schema's global reference mode allows inline. Before storage or rendering, content is **normalized**: inline nodes are flattened, assigned ids, and slot values become id references. @genetik/content owns normalization and id generation.
- **Node shape (minimal)**:
  - `id`: key in the map (or implied by map key).
  - `block`: block type (must exist in schema).
  - `config`: block-specific configuration (validated against **JSON Schema** for that block).
  - **Slots**: id reference(s) or, when schema allows, inline node(s) that are normalized to ids.
- **Entry point**: One designated root id (e.g. `entryId` at top level) pointing into the node map.

So: **schema has a global reference mode** (id / inline / both) that applies to all slots; **canonical form is always flat + ids**; normalization is a defined step when input uses inline.

### 2.3 Open design choices

- None; versioning is decided (explicit schema/content version fields for migrations).

---

## 3. Proposed Package Structure

All under the `@genetik` scope; names are placeholders to debate.

| Package | Role |
|--------|------|
| **@genetik/schema** | Define block types, config schemas, slots. Schema registry and validation. **Build-time** plugin API for "register block type / extend schema". |
| **@genetik/content** | Types and helpers for the content model (flat nodes, entry id). Validation of a JSON definition against a schema (using @genetik/schema). Optional: normalization (e.g. inline → flat), migration helpers. |
| **@genetik/patches** | Structured mutations over content: add node, remove node, reorder slot, update config. Used by revisions (drafts/published, history), undo/redo, and LLM edit-in-place. Apply patch to definition → new definition. |
| **@genetik/renderer** | **Framework-agnostic core**: takes (content JSON + schema + component map), resolves slots to children, injects config. **@genetik/renderer-react** (or similar): React binding that consumes the core and renders a React tree. Other framework bindings later. |
| **@genetik/builder** | **Drag-and-drop** UI builder. Schema-aware: only offers blocks/slots allowed by schema. Outputs content JSON consumable by the renderer. Uses renderer for live preview. |
| **@genetik/llm-context** | Consumes schema (and optionally example content) and produces prompt/context so an LLM can emit valid content JSON. Supports **both** "generate full definition from scratch" and "edit existing JSON" (e.g. output a patch or updated definition). Optional: output validation + retry. |
| **@genetik/media** | Image/media manager: **upload + URL** initially. Storage abstraction so we can expand later (transforms, resize/crop, CDN ids). Schema can reference "media" type for asset ids. |
| **@genetik/revisions** | **Drafts vs published** + **linear history**. Implemented on top of **@genetik/patches**: store patch sequences or snapshots, rollback, promote draft → published. Content stored as JSON (no DB requirement initially); design allows DB or file-backed storage later. |
| **@genetik/forms** | Form context for CMS: define forms (e.g. per-block edit forms), bind form state to content patches. Renderer can expose form context so blocks can show edit UIs in builder mode. |
| **@genetik/validation** | Separate package. Link integrity (no dangling ids), no cycles, required slots filled. Used by @genetik/content, builder, llm-context. |
| **@genetik/theme** | Theming plugin/package; consumed by renderer, builder, and other packages when needed. |
| **@genetik/i18n** | Internationalization plugin/package; consumed by other packages when needed. |

---

## 4. Additional Concepts & Packages

- **@genetik/registry**: Build if required. Central place for all known block types and their metadata (label, icon, category, default config). Builder and LLM-context could depend on this; implemented on top of @genetik/schema.
- **Templates / presets**: Ensure we can support in the future. Reusable content fragments (e.g. two-column layout, pricing section); data model and schema should allow for this.
- **@genetik/validation**: Yes, separate package. Beyond valid-against-schema: link integrity (no dangling ids), no cycles, required slots filled. Clear error reporting for builder and LLM. Used by other packages.
- **@genetik/server**: Ensure we can support in the future. Optional backend helpers: save/load content, run validation, media URLs, revisions. Design so a server layer can be added later.
- **@genetik/theme**: Separate plugin/package for theming; consumed by renderer, builder, and other packages when needed (see §5 Theming).
- **@genetik/i18n**: Separate plugin/package for internationalization; consumed by other packages when needed (see §5 i18n).

---

## 5. Decisions (locked in)

| Topic | Decision |
|-------|----------|
| **Framework** | Framework-agnostic core everywhere. First UI implementation: React wrapper(s) where needed (e.g. @genetik/renderer-react, builder built with React). |
| **Builder** | Build a **drag-and-drop** editor (not form-based first). |
| **Storage** | Content as JSON for now; no DB requirement. Design so a file-backed or database-backed layer can be added later. |
| **Plugins** | **Build-time loading**: plugins are loaded at build time (not runtime). Schema/plugin API registers block types and extensions when the app is built. |
| **Media** | **Upload + URL** in the initial approach; design so we can expand later (transforms, resize/crop, CDN ids). |
| **Revisions** | **Drafts and published** + **linear history**. Use a **patches** concept to implement: history as patch sequence (or snapshots), rollback, promote draft → published. |
| **LLM** | Support **both**: generate full JSON from scratch and edit existing JSON (e.g. LLM outputs a patch or updated definition). |
| **Schema format** | **JSON Schema** per block type for block config. Standard, tooling-rich, validatable. |
| **References** | Support **both** id and inline. The **schema has a global option** (e.g. `slotReferenceMode`: **id** | **inline** | **both**) that applies to all slots. Inline nodes are normalized to flat + generated ids before storage and rendering; @genetik/content owns normalization. |
| **Schema/content versioning** | **Yes.** Explicit schema version and/or content version fields for migrations and compatibility. |
| **Theming** | **Separate plugin/package** (@genetik/theme or similar). Used by other packages when needed. Not part of core block config. |
| **i18n** | **Its own plugin/package** (@genetik/i18n or similar). Used by other packages when needed. |

---

## 6. Remaining questions

None; previous open items are decided (see §5 and §4).

---

## 7. Dependencies Between Packages (Rough)

- **@genetik/schema**: no genetik deps (foundation).
- **@genetik/content**: depends on @genetik/schema (validation).
- **@genetik/patches**: depends on @genetik/content (types; apply patch → new definition).
- **@genetik/renderer** (core): depends on @genetik/schema, @genetik/content. **@genetik/renderer-react**: depends on renderer core + React.
- **@genetik/builder**: depends on @genetik/schema, @genetik/content, renderer (for preview).
- **@genetik/llm-context**: depends on @genetik/schema (and optionally @genetik/content for examples); should work with patch format for edit-in-place.
- **@genetik/revisions**: depends on @genetik/content, **@genetik/patches** (history as patches/snapshots, rollback).
- **@genetik/media**, **@genetik/forms**: minimal genetik deps; integrate via CMS or app layer.
- **@genetik/validation**: depends on @genetik/schema, @genetik/content; used by content, builder, llm-context.
- **@genetik/theme**, **@genetik/i18n**: minimal genetik deps; consumed by renderer, builder, and other packages when needed.

---

## 8. What We're Not Deciding Yet

- Monorepo layout (e.g. `packages/schema`, `packages/content`, … under this repo).
- Exact npm package names (e.g. `@genetik/core` vs `@genetik/schema`).
- API shapes and file structure.
- Whether "blocks" are the only construct or we also have "layouts" / "templates" as first-class schema concepts.

---

## 9. Suggested tools and libraries

Useful existing tools and libraries for building each package. Not prescriptive; options to evaluate.

### Schema and content

| Concern | Tools / libraries |
|--------|--------------------|
| **JSON Schema validation** | [ajv](https://github.com/ajv-validator/ajv) (fast, widely used), [ajv-formats](https://github.com/ajv-validator/ajv-formats) for string formats. Use in @genetik/schema and @genetik/content. |
| **Types from schema** | [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript) or [quicktype](https://quicktype.io/) to generate TypeScript types from JSON Schema. |
| **ID generation** | [nanoid](https://github.com/ai/nanoid) or [uuid](https://github.com/uuidjs/uuid) for node ids during normalization. |

### Patches and revisions

| Concern | Tools / libraries |
|--------|--------------------|
| **JSON Patch (RFC 6902)** | [fast-json-patch](https://github.com/Starcounter-Jack/JSON-Patch) to produce/apply patches. Optional standard for @genetik/patches. |
| **Immutable updates** | [immer](https://github.com/immerjs/immer) if you want a mutable-style API that produces new content. |
| **Diff / history** | [deep-diff](https://github.com/flitbit/diff), or store full snapshots and use fast-json-patch for diff. |

### Renderer

| Concern | Tools / libraries |
|--------|--------------------|
| **React** | React itself; keep renderer core framework-agnostic (plain data → tree description), then a thin React binding. |
| **Slots / composition** | Custom resolution (walk content, resolve ids); no heavy dependency. |

### Builder (drag-and-drop, forms)

| Concern | Tools / libraries |
|--------|--------------------|
| **Drag and drop** | [@dnd-kit/core](https://github.com/clauderic/dnd-kit) (modern, accessible, flexible) or [react-dnd](https://github.com/react-dnd/react-dnd). dnd-kit works well with sortable lists and nested containers. |
| **Forms (block config)** | [react-hook-form](https://react-hook-form.com/) with [@hookform/resolvers](https://github.com/react-hook-form/resolvers) (e.g. ajv resolver) to drive forms from JSON Schema. |
| **Schema-driven forms** | [@rjsf/core](https://github.com/rjsf-team/react-jsonschema-form) (React JSON Schema Form) if you want full auto-generated UIs; or custom fields + react-hook-form. |
| **Tree / hierarchy UI** | [react-arborist](https://github.com/brimdata/react-arborist), [@atlaskit/tree](https://atlaskit.atlassian.com/packages/tree), or custom list + DnD for slot hierarchy. |

### LLM context

| Concern | Tools / libraries |
|--------|--------------------|
| **Schema → prompt** | Serialize JSON Schema (or a subset) for system prompt; or [json-schema-to-openapi](https://www.npmjs.com/package/json-schema-to-openapi) if targeting OpenAPI-shaped APIs. |
| **Validate LLM output** | Same ajv pipeline; validate then retry or fix. |
| **Structured output** | [Vercel AI SDK](https://sdk.vercel.ai/), [OpenAI SDK](https://github.com/openai/openai-node), or custom with JSON mode. |

### Validation (link integrity, cycles)

| Concern | Tools / libraries |
|--------|--------------------|
| **Cycle detection** | Simple DFS/BFS on the id graph, or [graphology](https://graphology.github.io/) if you need full graph ops. |
| **Dangling refs** | One pass over content: collect all ids, then check every slot reference exists. |

### Media

| Concern | Tools / libraries |
|--------|--------------------|
| **Upload UI** | [react-dropzone](https://github.com/react-dropzone/react-dropzone), [uppy](https://uppy.io/). |
| **Storage** | Define an interface; plug in S3, Cloudinary, or local. No single library; keep adapter-based. |

### Theme and i18n

| Concern | Tools / libraries |
|--------|--------------------|
| **Theming** | CSS variables + a small API, or [styled-components](https://styled-components.com/), [Tailwind](https://tailwindcss.com/), or [style-dictionary](https://amzn.github.io/style-dictionary/) for design tokens. |
| **i18n** | [i18next](https://www.i18next.com/), [react-intl](https://formatjs.io/docs/react-intl/), or [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) (smaller). |

### Monorepo and build

| Concern | Tools / libraries |
|--------|--------------------|
| **Package build** | [tsdown](https://tsdown.dev/) (simple, ESM+CJS, Rolldown-powered), [unbuild](https://github.com/unjs/unbuild), or Vite lib mode. |
| **Testing** | [Vitest](https://vitest.dev/) (fast, ESM-friendly). |
| **Linting / format** | ESLint, Prettier (already in place). |

---

## 10. Way of working

We work in **small, incremental changes**. Every change must:

1. **Implement or update tests** — New behavior gets tests; changed behavior gets updated tests. No untested code.
2. **Add or update documentation** — Document in the Docusaurus docs app (apps/docs): new concepts, APIs, or guides as needed for the change.
3. **Run relevant tests and validation** — Before considering a change done, run the relevant test suite and any lint/type checks; fix failures before moving on.

This keeps the codebase stable, documented, and verifiable at every step. See the docs app: [Development → Way of working](/docs/development/way-of-working).

---

## Next steps

- Answer or refine the **remaining questions** in §6.
- Add/remove/rename packages in §3 and §4.
- Lock in data model details in §2 (references, config shape, versioning).
- Once stable, break into phases (e.g. schema + content + patches + renderer first, then builder, then LLM, then CMS plugins).
