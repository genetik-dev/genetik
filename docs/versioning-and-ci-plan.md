# Versioning, Publishing, and CI Plan

Plan for independent package versioning, automated npm publish, GitHub Pages docs, and changelogs using GitHub Actions.

---

## Decisions (resolved)

| Topic | Decision |
|-------|----------|
| **npm scope** | `@genetik` is an org you control on npm. Use `"publishConfig": { "access": "public" }` for all scoped packages. |
| **Changelog source** | **Changesets** — manual “what changed” notes when running `pnpm changeset`. |
| **GitHub Pages** | **Deploy from GitHub Actions** — build docs in CI, upload artifact, use the “GitHub Pages” source = “GitHub Actions” in repo settings. |
| **Publishable packages** | Publish all packages: `@genetik/schema`, `@genetik/content`, `@genetik/patches`, `@genetik/renderer`, `@genetik/renderer-react`, `@genetik/eslint-config`, `@genetik/typescript-config`. Do **not** publish root or `docs`. |
| **Branch model** | Protect `main` so all changes land via PRs; release runs on `push` to `main` (after merge). See [Branch protection](#branch-protection) below. |

---

## Goals (summary)

| Goal | Approach |
|------|----------|
| Independent versions per package | Each package has its own `version` in package.json; tooling bumps only changed packages. |
| Auto version, build, publish on merge to main | GitHub Action on `push` to `main`: detect changes → version → build → publish to npm. |
| Build and serve docs on GitHub Pages when main changes | GitHub Action builds Docusaurus and deploys to GitHub Pages (branch or Actions deploy). |
| Only build/publish what changed | Use change detection (e.g. git diff, Turborepo, or Changesets) to compute affected packages and run build/publish only for those. |
| Update dependents when a dependency’s version changes | When we bump e.g. `@genetik/content`, bump and publish packages that depend on it (and rely on range specs like `workspace:*` → published `^x.y.z`). |
| Use GitHub Actions for everything | One or more workflows: version+publish, docs deploy; optionally lint/test on PR. |
| Public on GitHub and npm | Repo public; each package has `publishConfig.access: "public"` and is published under `@genetik`. |
| Generate changelogs per package | Per-package CHANGELOG (e.g. CHANGELOG.md) updated on release, from Conventional Commits or Changesets. |

---

## 1. Versioning strategy: independent + change-based

- **Tool**: **Changesets** is the most common choice for “independent versions + only what changed + changelogs” in a pnpm monorepo.
  - You (or a bot) add a **changeset** when you change a package (e.g. “patch `@genetik/content`”, “minor `@genetik/renderer` with breaking change”).
  - On release, Changesets:
    - Considers only packages that have changesets (or that depend on version-bumped packages).
    - Bumps versions (major/minor/patch) per package.
    - Updates dependents’ `package.json` to use the new dependency versions (e.g. `@genetik/content` from `1.2.3` to `1.2.4` and dependents that depend on it get the new range).
    - Writes/updates `CHANGELOG.md` per package from the changeset notes.
- **Alternative**: **Lerna** with independent mode + `--conventional-commits` can also drive versions and changelogs from commit messages, but Changesets is lighter and fits pnpm + Turborepo well.

**Recommendation**: Use **Changesets**.

- Add `@changesets/cli` at the root.
- Developers (or a bot) run `pnpm changeset` when they change a package; commit the changeset file.
- Release workflow (on main) runs `pnpm changeset version` (consumes changesets, bumps versions, updates dependents), then build and publish.

---

## 2. Detecting what changed and what to build/publish

- **Option A – Changesets**  
  “What to publish” = packages that have a changeset (or that depend on a version-bumped package). After `changeset version`, the only packages with a version bump in `package.json` are the ones we need to build and publish. So we can:
  - Run `changeset version` first.
  - Derive “list of packages whose version changed” (e.g. by comparing to previous commit or a stored baseline).
  - Run build (and publish) only for those packages (e.g. with `pnpm --filter '[main]' build` and a filter that matches only version-bumped packages, or a small script that reads git diff of `package.json` and infers packages).

- **Option B – Git + Turborepo**  
  Use Turborepo’s “affected” behavior: e.g. `turbo run build --filter='...[origin/main]'` to build only packages affected by the current diff vs `origin/main`. Then we still need a separate way to decide *version* bumps (e.g. Conventional Commits or manual changesets). So we’d combine:
  - Versioning: Changesets (or another versioning strategy).
  - Build/publish: only run for packages that (1) had a version bump in this run, or (2) are in the “affected” set and have a changeset. Simplest is “version with Changesets, then build/publish every package that got a version bump.”

**Recommendation**:  
- Use **Changesets** to decide versions and dependents.  
- “What to publish” = set of packages whose `version` in `package.json` changed in the release commit (compared to the commit before `changeset version`).  
- Build only those packages (and their dependencies, which are already built). In practice: run `pnpm build` with a filter that includes only packages with a new version, or run full `pnpm build` (Turborepo will cache unchanged packages and only build what’s needed). Full build is simpler and Turborepo keeps it fast.

---

## 3. Ensuring dependents get updated

- **Changesets** handles this: when you add a changeset for e.g. `@genetik/content` (patch), and `@genetik/renderer` depends on it, you can configure a “fixed” or “linked" group so that `@genetik/renderer` gets a patch bump in the same release when `@genetik/content` is bumped. Or you leave them independent and only bump dependents when you explicitly add a changeset for them.
- For **internal dependency versions**: when we run `pnpm changeset version`, Changesets will replace `workspace:*` (or the current range) in dependents’ `package.json` with the new version range (e.g. `^1.2.4`) for packages that were bumped. So dependents will point at the newly published versions. We need to ensure published `package.json` files use the published range (e.g. `^1.2.4`) not `workspace:*` when published to npm. Changesets does not rewrite `workspace:*` to a version by default; **pnpm** can do that at publish time with `pnpm publish --no-git-checks` from each package, and the published manifest will have the resolved version from the lockfile. So we must either:
  - Use a post-version script or a tool (e.g. `@changesets/cli` with `"updateInternalDependencies": "patch"`) so dependents get their dependency ranges updated to the new versions, and then when we publish, the published `package.json` already has `^x.y.z` for internal deps, or
  - Continue using `workspace:*` in source and rely on a build step that rewrites `workspace:*` to a version range when packing for npm (e.g. `pnpm publish` with a custom script that replaces `workspace:*` with the version from the lockfile or from the repo).  
  **Recommendation**: Use Changesets’ **updateInternalDependencies** so when we bump `@genetik/content`, dependents like `@genetik/renderer` get their dependency on `@genetik/content` updated to the new version in `package.json`; then publish as usual.

---

## 4. GitHub Actions workflows (high level)

### 4.1 On push to `main` (two workflows)

We use **two separate steps**: first a **version** workflow that only commits (and optionally tags), then a **release** workflow that runs on the next push and does build + publish + docs. That way the version-bump commit is on `main` before we publish.

- **Trigger for both**: `push` to `main`.

**Workflow 1 — Version (commit only)**  
- Checkout, install pnpm and deps.  
- Run `pnpm changeset version`.  
- If there are **no** changesets, exit successfully (do nothing).  
- If there **are** version bumps: commit the updated `package.json` files, CHANGELOGs, and lockfile; optionally create a tag (e.g. `release-v1.2.3` or per-package tags); push to `main`.  
- Do **not** build or publish in this workflow.

**Workflow 2 — Release (build, publish, docs)**  
- Runs on every push to `main` (including the push that was just the version-bump commit).  
- Checkout, install pnpm and deps.  
- Run `pnpm build` (Turborepo caches; builds all packages + docs).  
- **Publish to npm**: for each package whose version in `package.json` is not yet published (or is ahead of npm), run `pnpm publish` (e.g. with a filter or from each package). Use **NPM_TOKEN** in repo secrets.  
- **Deploy docs**: upload the built docs (e.g. `apps/docs/build`) as an artifact and deploy via **Deploy from GitHub Actions** (`actions/upload-pages-artifact` + `actions/deploy-pages`). In repo **Settings → Pages**, set Source to “GitHub Actions”.  

Implementation note: both can live in one workflow file with two jobs (version job runs first and may push; release job runs after and does build/publish/deploy), or in two workflow files that both trigger on `push` to `main`. If in one file, the version job must push and then the release job runs in the same run—but the push will trigger a **new** run, so the “release” work (build, publish, docs) will typically run in that second run, with the version-bump commit already on `main`. So either: (A) one workflow, version job pushes and fails/skips the release job in that run, and the re-run does release; or (B) two workflows, version workflow pushes and the resulting push triggers the release workflow. Option (B) is clearer: **version** workflow only commits and pushes; **release** workflow always runs on push and does build + publish + docs (no-op publish for packages already at that version on npm).

### 4.2 On pull request

- **Trigger**: `pull_request` (e.g. toward `main`).
- **Jobs**:
  - Lint: `pnpm lint`.  
  - Type-check: `pnpm check-types`.  
  - Test: `pnpm test`.  
  - Optional: “Version check” – if there are code changes under a package but no changeset file, fail or warn (e.g. with a Changesets bot or a small script that checks for changeset files).

No publish or version bump on PRs; only on merge to `main`.

---

## 5. Changelogs

- **Changesets**: Each changeset file includes a short message. When we run `changeset version`, it appends to each package’s `CHANGELOG.md` (or creates it) with the new version and the messages for that package. So changelogs are generated from changesets; no need for Conventional Commits if you don’t want to rely on commit message parsing.
- **Alternative – Conventional Commits**: Use a tool that parses commit messages (e.g. `standard-version` per package or `lerna version --conventional-commits`) to generate changelog entries and decide bump type. Then you don’t need to run `pnpm changeset` manually, but you must enforce commit message format.
- **Recommendation**: Use **Changesets** for both versioning and changelog content; keep commits flexible.

---

## 6. Package.json and publish readiness

Publishable packages: **schema**, **content**, **patches**, **renderer**, **renderer-react**, **eslint-config**, **typescript-config**. Root and **docs** are not published.

For each publishable package:

- `"publishConfig": { "access": "public" }` so `@genetik/...` is public on npm.
- `"files": ["dist"]` (or the correct list for that package; config packages may use different entries) so only intended artifacts are published.
- **No** `"private": true` for packages we publish.
- Root and `docs` keep `"private": true` and are never published.

---

## 7. Order of operations (on main, after merge)

We use a **two-step** flow so the version-bump commit is on `main` before we publish.

**Step 1 — Version workflow (runs on push to `main`)**  
1. Checkout; install deps (`pnpm install`).  
2. Run `pnpm changeset version`.  
3. If no changesets: exit (nothing to do).  
4. If there are version bumps: commit updated `package.json` files, CHANGELOGs, and lockfile; optionally tag; push to `main`.  
5. Do not build or publish in this workflow.

**Step 2 — Release workflow (runs on push to `main`, including after the version push)**  
1. Checkout; install deps.  
2. Build: `pnpm build` (all packages + docs; Turborepo caches).  
3. Publish to npm: for each package whose version is not yet on npm, run `pnpm publish`. Use `NPM_TOKEN`.  
4. Deploy docs: upload built docs artifact and deploy via **Deploy from GitHub Actions** (upload-pages-artifact + deploy-pages).

So: merge to `main` → version workflow runs; if it pushed a version commit, that push triggers the release workflow, which builds, publishes, and deploys docs. The version-bump commit is already on `main` before any publish.

---

## 8. Summary checklist

- [ ] Add **Changesets** at root (`pnpm add -D @changesets/cli`), add `changeset` script, initialize `.changeset/config.json` (e.g. link packages, updateInternalDependencies).
- [ ] Add **publishConfig** and **files** to every publishable package; remove **private** from those.
- [ ] Create **GitHub Actions workflows** (two-step on push to main):
  - **Version**: on push to main, run `changeset version`; if there are changesets, commit and push (no build/publish).
  - **Release**: on push to main, build, publish to npm (only packages not yet at that version on npm), deploy docs to GitHub Pages.
  - On PR: lint, typecheck, test; optionally require a changeset.
- [ ] Store **NPM_TOKEN** in repo secrets; use it in the publish step.
- [ ] Configure **GitHub Pages**: Settings → Pages → Source = **GitHub Actions**; workflow uploads the built docs artifact and uses `actions/deploy-pages`.
- [ ] **Protect `main`** (see below).
- [ ] Document in CONTRIBUTING or README: “Add a changeset with `pnpm changeset` when you change a package.”

---

## Branch protection

Protect `main` so that all changes land via PRs and the release workflow only runs after a merge. In the repo:

1. **Settings → Branches → Add branch protection rule** (or edit the rule for `main`).
2. **Branch name pattern**: `main`.
3. Enable:
   - **Require a pull request before merging** (e.g. require 1 approval if you want).
   - **Require status checks to pass before merging** — add the PR workflow (e.g. “Lint and test” or the name of your PR job) so merges only succeed when CI passes.
   - **Do not allow bypassing the above** (optional but recommended for consistency).
4. **Allow force pushes**: No (recommended).
5. **Restrict who can push to matching branches**: optional; leave empty unless you use CODEOWNERS.

Result: every change to `main` comes from a merged PR, and the “Version and release” workflow runs on each push to `main` (i.e. after each merge).
