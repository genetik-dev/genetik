# @genetik/renderer

Framework-agnostic core: resolves content + schema into a **resolved tree** (ResolvedNode). No UI framework; use @genetik/renderer-react (or another binding) to map the tree to components.

## Installation

```bash
pnpm add @genetik/renderer
```

## Usage

- **resolve(content, schema)** — Returns the root ResolvedNode, or null if the entry node is missing. Each node has `block`, `config`, and `slots` (slot name → ordered array of ResolvedNode).

See the [docs](/docs/packages/renderer) for API and examples.
