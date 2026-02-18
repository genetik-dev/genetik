---
sidebar_position: 1
---

# Introduction

**Genetik** is a JSON-driven UI ecosystem: schema-defined blocks, flat content trees, and a plugin-based renderer for CMS, LLM-driven UIs, and dynamic applications.

## Core ideas

- **JSON as source of truth** — UI structure and configuration live in data, not only in code.
- **Schema-first** — A single schema defines what's allowed; it drives validation, tooling, and rendering.
- **Flat content model** — Content is a flat map of nodes by id plus one entry id; slots reference children by id. Easy to patch, merge, and reason about.
- **One content model, many consumers** — The same content can power editors, headless APIs, static site generation, and LLM-generated UIs.

## Packages

All packages are under the **@genetik** scope. The docs reference the ones currently in this repo:

| Package | Role |
|--------|------|
| [@genetik/schema](./packages/schema) | Block types, config schemas, slots. Build-time plugin API. |
| [@genetik/content](./packages/content) | Flat content model, validation, normalization (inline → flat). |
| [@genetik/patches](./packages/patches) | Structured mutations: add/remove/reorder nodes, update config. |
| [@genetik/renderer](./packages/renderer) | Framework-agnostic core: content + schema + component map → UI. |
| [@genetik/renderer-react](./packages/renderer-react) | React binding for the renderer. |
| [@genetik/editor](./packages/editor) | Editor mutations and schema plugin. |
| [@genetik/editor-react](./packages/editor) | React editor UI: palette, canvas, config panel. |
| [@genetik/context-events](./packages/context-events) | Page context and context overrides for blocks. |

See the [Packages](./packages) section for full reference.

## Tutorial

To build a small content editor (block palette, visual canvas, JSON mode, and preview) step by step, follow the **[Tutorial](./tutorial-basics/define-the-schema)**. You can try the result in the [Playground](/playground).
