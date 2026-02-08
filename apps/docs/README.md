# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator. It depends on the `@genetik/*` workspace packages.

## Installation

From the **repository root** (so workspace packages are linked and built):

```bash
pnpm install
pnpm build
```

Then from this directory (or from root with a filter):

```bash
pnpm --filter docs start
```

## Local Development

```bash
pnpm --filter docs dev
```

Or from `apps/docs`: `pnpm dev`. This starts a local dev server (port 3001). Most changes are reflected live. In development, the docs app resolves `@genetik/*` to package **source** (via `plugins/genetik-source.cjs`) so edits in `packages/*` trigger HMR without rebuilding dist. Production builds use the built packages from dist.

## Build

From the repo root (builds all packages then docs):

```bash
pnpm build
```

Or only the docs app (Turbo will still build dependency packages first):

```bash
pnpm --filter docs build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Using SSH:

```bash
USE_SSH=true yarn deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
