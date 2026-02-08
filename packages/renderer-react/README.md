# @genetik/renderer-react

React binding for **@genetik/renderer**: renders resolved content with a map of block type → React component. Consumes flat content and a schema from @genetik/content and @genetik/schema.

## Installation

```bash
pnpm add @genetik/renderer-react
```

Peer dependency: `react` (>=18.0.0).

## Usage

- **renderContent(content, schema, componentMap)** — Resolves content with the schema and renders the root. Returns a React node or null if the entry is missing.
- **renderNode(node, componentMap)** — Renders a single resolved node (and its slots recursively). Unknown block types render as null.

Block components receive **BlockProps**: `config` (block config) and `slots` (record of slot name → `ReactNode[]`).

See the [docs](/docs/packages/renderer-react) for API and examples.
