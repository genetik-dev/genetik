# Agent guidance for Decal

When updating this repository, follow the **way of working** and **architecture** defined for the project.

## Way of working (required every change)

1. **Small, incremental changes** — One logical change per step.
2. **Tests** — Implement or update tests for new or changed behavior; no untested code.
3. **Documentation** — Add or update docs in the Docusaurus app (`apps/docs/docs/`) to reflect the change.
4. **Validate** — Run relevant tests and lint/type checks (`pnpm lint`, `pnpm check-types`); fix failures before finishing.

## Architecture

- **Content model**: Flat — entry id + node map; slots are id references. Inline nodes (when schema allows) are normalized to flat by @decal/content.
- **Schema**: JSON Schema per block; per-slot reference mode (id / inline / both). Build-time plugins only.
- **Packages**: Under `@decal` scope; renderer is framework-agnostic with React (or other) in separate bindings. See package roles and deps in the plan.

## References

- **Full plan**: [decal-ecosystem-plan.md](decal-ecosystem-plan.md)
- **Way of working (docs)**: [apps/docs/docs/development/way-of-working.md](apps/docs/docs/development/way-of-working.md)
- **Cursor rules**: [.cursor/rules/](.cursor/rules/) — detailed rules for way of working, architecture, and docs app.
