# Contributing

- **Way of working**: [apps/docs/docs/development/way-of-working.md](apps/docs/docs/development/way-of-working.md) — one logical change per step; add or update tests and docs; run lint and type-check before you’re done.
- **Releases and changesets**: When you change a publishable package (`packages/*`), add a changeset so the next release can version and publish it:
  1. From the repo root, run `pnpm changeset`.
  2. Choose the packages you changed and the bump type (major / minor / patch).
  3. Write a short summary for the changelog.
  4. Commit the new file under `.changeset/` with your PR.
- **Architecture**: [.cursor/rules](.cursor/rules) and [genetik-ecosystem-plan.md](genetik-ecosystem-plan.md).

See also [README.md](README.md) and [AGENTS.md](AGENTS.md).
