# Changesets

When you change a publishable package, add a changeset so the next release can version and publish it.

Run from the repo root:

```bash
pnpm changeset
```

Choose the packages you changed, the bump type (major/minor/patch), and write a short summary. Commit the new file under `.changeset/` with your PR.

See [versioning-and-ci-plan.md](../docs/versioning-and-ci-plan.md) and the [way of working](../apps/docs/docs/development/way-of-working.md) for the full release flow.
