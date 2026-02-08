# Genetik

A JSON-driven UI ecosystem: schema-defined blocks, flat content trees, and a framework-agnostic renderer. Built for CMS editors, LLM-generated UIs, and dynamic applications.

This repository is a **pnpm + Turborepo** monorepo. All packages are under the `@genetik` scope.

## What's in the repo

### Apps

- **docs** — [Docusaurus](https://docusaurus.io/) site with package docs and an interactive **Playground** where you edit content JSON and see it rendered with `@genetik/renderer-react`.

### Packages (@genetik)

| Package | Description |
|--------|-------------|
| **@genetik/schema** | Block types, config (JSON Schema), slots. Schema registry and validation. Build-time plugin API. |
| **@genetik/content** | Flat content model (entry id + node map). Validation, normalization (inline → flat + ids), `parseContentJson` for raw JSON. |
| **@genetik/patches** | Structured mutations: add/remove/reorder/update. `applyPatch(content, patch)` for revisions and edit-in-place. |
| **@genetik/renderer** | Framework-agnostic core: `resolve(content, schema)` → resolved tree. Accepts content object or JSON string. |
| **@genetik/renderer-react** | React binding: `renderContent(content, schema, componentMap)` to render content with your block components. |
| **@genetik/eslint-config** | Shared ESLint config (base, Next.js, etc.). |
| **@genetik/typescript-config** | Shared `tsconfig` bases used across the monorepo. |

See [genetik-ecosystem-plan.md](./genetik-ecosystem-plan.md) for the full architecture and roadmap.

## Requirements

- **Node** ≥ 18 (see [.nvmrc](.nvmrc))
- **pnpm** 9 (see `packageManager` in root [package.json](package.json))

## Commands (from repo root)

```bash
# Install dependencies
pnpm install

# Build all packages and the docs app
pnpm build

# Run all tests
pnpm test

# Lint and type-check
pnpm lint
pnpm check-types

# Format code
pnpm format

# Start dev servers (packages in watch mode; docs at http://localhost:3001)
pnpm dev
```

### Filter by package or app

```bash
pnpm --filter @genetik/schema build
pnpm --filter docs dev
pnpm --filter @genetik/content test
```

## Docs and Playground

- **Local docs**: `pnpm --filter docs dev` then open http://localhost:3001. The **Playground** page lets you edit content JSON and see it rendered live.
- **Build and serve**: `pnpm build` then `pnpm --filter docs serve`.

## Contributing

- **Way of working**: [apps/docs/docs/development/way-of-working.md](apps/docs/docs/development/way-of-working.md) — small changes, tests, docs, then validate (lint + type-check).
- **Releases**: When you change a publishable package, add a **changeset** so the next release can version and publish it: run `pnpm changeset` from the repo root, choose the packages and bump type, then commit the new file under `.changeset/`. See [.changeset/README.md](.changeset/README.md) and [docs/versioning-and-ci-plan.md](docs/versioning-and-ci-plan.md).
- **Architecture**: [.cursor/rules](.cursor/rules) and [genetik-ecosystem-plan.md](genetik-ecosystem-plan.md).
- **Agent guidance**: [AGENTS.md](AGENTS.md).

## License

MIT. See [LICENSE](LICENSE).
