---
sidebar_position: 2
---

# Releases and CI

This repo uses **independent versions** per package, **Changesets** for versioning and changelogs, and **GitHub Actions** to version, build, publish to npm, and deploy docs to GitHub Pages.

## When you change a package

If you change code in any **publishable** package (under `packages/`), add a **changeset** so the next release can bump its version and publish:

1. From the repo root: `pnpm changeset`
2. Select the package(s) you changed
3. Choose the bump type: **patch** (bug fixes), **minor** (new features), **major** (breaking changes)
4. Write a short summary for the changelog
5. Commit the new file under `.changeset/` with your PR

No changeset is needed for the root or the `docs` app.

## What runs in CI

| Trigger | Workflow | What it does |
|--------|----------|--------------|
| **Push to `main`** | **Version** | Runs `pnpm changeset version`. If there are pending changesets, commits version bumps and CHANGELOG updates and pushes to `main`. |
| **Push to `main`** | **Release** | Builds all packages, publishes to npm (only packages under `packages/`), builds docs, and deploys them to GitHub Pages. |
| **Pull request** | **CI** | Lint, type-check, and test. Must pass before merge. |

The version workflow runs first; if it pushes a new commit, that push triggers the release workflow. So the version-bump commit is on `main` before anything is published.

## Setup (maintainers)

- **npm**: Add `NPM_TOKEN` (npm automation token) to the repo’s **Secrets** so the release workflow can publish.
- **GitHub Pages**: In **Settings → Pages**, set **Source** to **GitHub Actions**. The release workflow uploads the built docs and deploys them.
- **Version workflow push (orgs only)**: If your GitHub org locks workflow permissions to read-only, add a repo secret **`REPO_ACCESS_TOKEN`** — a PAT (classic) with **contents: write** — so the Version workflow can push the version-bump commit.
- **Version workflow + protected main**: If `main` is protected with “Require a pull request before merging”, direct pushes (including from the workflow) are blocked. Add the **user who owns the PAT** (used as `REPO_ACCESS_TOKEN`) to **Allow specified actors to bypass required pull requests** in the branch protection rule so the version workflow can push. Alternatively, change the workflow to open a PR with the version bump instead of pushing (then merge that PR manually or with auto-merge).
- **Branch protection**: Protect `main` (e.g. require PRs and status checks) so normal changes go through CI. See [versioning-and-ci-plan.md](https://github.com/your-org/genetik/blob/main/docs/versioning-and-ci-plan.md#branch-protection) in the repo.

Full plan: [docs/versioning-and-ci-plan.md](https://github.com/your-org/genetik/blob/main/docs/versioning-and-ci-plan.md) in the repository.
