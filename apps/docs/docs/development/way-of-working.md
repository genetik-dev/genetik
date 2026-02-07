---
sidebar_position: 1
---

# Way of working

We build the Decal ecosystem in **small, incremental changes**. Each change follows the same cycle so the codebase stays stable, documented, and verifiable.

## The cycle

For every change (feature, fix, or refactor):

### 1. Make the change small and focused

- Prefer one logical change per commit (or small batch of commits).
- If a change grows large, split it into steps and complete the cycle for each step.

### 2. Implement or update tests

- **New behavior** → add tests that define and verify the behavior.
- **Changed behavior** → update existing tests and add new ones if needed.
- Do not merge or move on with untested code.

### 3. Add or update documentation

- Update the **Docusaurus docs** (this app) to reflect the change:
  - New concepts, APIs, or packages → new or updated docs pages.
  - Changed behavior → update the relevant docs so they stay accurate.
- Documentation lives in `apps/docs/docs/`. Add guides, API notes, or architecture updates as needed.

### 4. Run tests and validation

- Run the **relevant tests** for the code you changed (e.g. package tests, or full monorepo).
- Run **lint and type checks** (e.g. `pnpm lint`, `pnpm check-types`).
- Fix any failures before considering the change done.

## Why this way

| Practice | Benefit |
|----------|---------|
| Small increments | Easier to review, debug, and revert. Less risk of long-lived broken states. |
| Tests with every change | Behavior is specified and guarded; refactors are safer. |
| Docs with every change | Documentation never drifts far from the code; onboarding stays current. |
| Run tests and validation | Broken builds are caught immediately, not later in CI or in another package. |

## Commands (reference)

From the repo root:

- **All tests**: `pnpm test` (when scripts are in place)
- **Lint**: `pnpm lint`
- **Type check**: `pnpm check-types`
- **Build**: `pnpm build`
- **Docs dev server**: `pnpm --filter docs dev` (or `turbo dev --filter=docs`)

Adjust as the monorepo scripts evolve; the principle remains: run the relevant checks before you’re done.
