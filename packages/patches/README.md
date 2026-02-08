# @genetik/patches

Structured mutations over Genetik content: add node, remove node, update config, reorder slot. Used by revisions (drafts/published, history), undo/redo, and LLM edit-in-place.

## Installation

```bash
pnpm add @genetik/patches
```

## Usage

- **applyPatch(content, patch)** — Apply one or more operations and return new content. Does not mutate input. Does not validate the result.

See the [docs](/docs/packages/patches) for API and examples.
