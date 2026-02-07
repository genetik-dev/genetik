# @genetik/content

Types, validation, and normalization for the Genetik content model: flat node map, entry id, validation against a schema, and inline → flat + id generation.

## Installation

```bash
pnpm add @genetik/content
```

## Usage

- **Types**: `GenetikContent`, `ContentNode`, `SlotValue`, `GenetikContentInput`, `InlineNode` — canonical and input shapes.
- **Validation**: `validateContent(schema, content)` — validates content against a schema (block types, config, slots, link integrity).
- **Normalization**: `normalizeContent(schema, input, options?)` — flattens inline nodes (when schema allows) and assigns ids.

See the [docs](/docs/packages/content) for full API and examples.
