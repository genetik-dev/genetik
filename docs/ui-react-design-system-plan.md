# @genetik/ui-react — Design System Plan

Plan to scaffold a React design system package used by the **page builder / CMS UI** and by **preconfigured Genetik blocks**. It will use **Tailwind CSS v4**, **Base UI** (via shadcn’s Base UI–powered components), and the **shadcn CLI** to add and maintain components.

---

## 1. Goals

- **Single design system** for the Genetik ecosystem: page builder UI, CMS chrome, and block library all use the same tokens and components.
- **Tailwind v4** for styling (CSS-first config, no `tailwind.config.js`; theme via `@theme` in CSS).
- **Base UI** for all primitives: shadcn/ui now offers **Base UI versions of all components** out of the box; we use those (style `base-*` in `components.json`).
- **shadcn CLI** to do the work: `shadcn init` and `shadcn add [component]` so we stay aligned with upstream and get Base UI–based code.
- **Package exports**: (1) a **Tailwind “config”** (v4: our theme as CSS or a preset consumers can use), and (2) a **bundled CSS** file so consumers can import one file and get full styles.
- **Consumable by**: future page builder / CMS app and preconfigured Genetik blocks.

---

## 2. Package: @genetik/ui-react

| Item | Choice |
|------|--------|
| **Name** | `@genetik/ui-react` |
| **Location** | `packages/ui-react/` |
| **Build** | tsdown for JS/TS (ESM + CJS + dts). Separate step to build CSS bundle (Tailwind v4 + our theme). |
| **Styling** | Tailwind v4. No `tailwind.config.js`; theme and layers live in CSS via `@theme` and `@import "tailwindcss"`. |
| **Primitives** | Base UI only — use shadcn’s Base UI–powered components (style `base-nova`, `base-vega`, etc.). |
| **CLI** | shadcn CLI for init and adding components (`pnpm dlx shadcn@latest init`, `pnpm dlx shadcn@latest add button card …`). |
| **Exports** | JS/TS from `src/index.ts`; **dist/styles.css** (bundled CSS); **theme/tailwind** export for consumers who want to run Tailwind themselves (see §4). |

---

## 3. Tailwind v4 (no config file)

- **Tailwind v4** does not use `tailwind.config.js`. Configuration is **CSS-first**:
  - In your main CSS file: `@import "tailwindcss";`
  - Custom tokens (colors, radius, etc.) go in a `@theme { ... }` block in CSS (or in a separate file you import).
- **Content/source**: v4 auto-detects source files in many setups; for a package, we may need `@source` in CSS to point at our component paths when building the bundle.
- **In ui-react**: We have a single “entry” CSS file (e.g. `src/styles.css`) that contains `@import "tailwindcss";`, `@theme { ... }` (our design tokens), and any `@source` needed so Tailwind scans our component files. The **build** step compiles this to **dist/styles.css** (bundled). We also export a **theme-only** CSS file or preset so apps that run Tailwind v4 themselves can import just our theme (optional).

---

## 4. What We Export for Consumers

1. **Bundled CSS**  
   - **dist/styles.css** (or **dist/genetik-ui.css**): full Tailwind v4 output including our `@theme` and all utilities used by our components.  
   - Consumers import it once: `import "@genetik/ui-react/dist/styles.css";` (or the path they use for the package). No Tailwind setup required in the app if they only use ui-react components.

2. **Tailwind “config” (v4 style)**  
   - We don’t export a JS config (v4 doesn’t use it). We export our **theme** in a form consumers can use if they run Tailwind themselves:
   - **Option A**: A CSS file **dist/theme.css** that contains only our `@theme { ... }` block. They `@import "@genetik/ui-react/dist/theme.css"` before or after `@import "tailwindcss"` in their app so our tokens are available.
   - **Option B**: Document the `@theme` block (or provide a copy-paste snippet) so they can paste it into their app’s CSS.
   - **Recommendation**: Export **dist/theme.css** (theme only) and **dist/styles.css** (full bundle). Consumers who want one-step styling use `dist/styles.css`; those who want to merge our theme into their own Tailwind build use `dist/theme.css`.

---

## 5. Package Structure (scaffold)

```
packages/ui-react/
├── package.json
├── tsconfig.json
├── tsdown.config.ts
├── components.json              # shadcn CLI config (style: base-nova or base-vega, etc.)
├── src/
│   ├── index.ts                 # re-exports all public components + utils
│   ├── styles.css               # Tailwind v4 entry: @import "tailwindcss"; @theme { ... }; @source for our components
│   ├── theme.css                # optional: only @theme for dist/theme.css output
│   ├── lib/
│   │   └── utils.ts             # cn() etc., required by shadcn components
│   └── components/              # shadcn CLI adds here (e.g. ui/button.tsx, ui/card.tsx)
│       └── ui/
│           ├── button.tsx
│           ├── input.tsx
│           ├── label.tsx
│           ├── card.tsx
│           ├── select.tsx
│           ├── dialog.tsx
│           ├── tabs.tsx
│           ├── badge.tsx
│           ├── textarea.tsx
│           └── ...
├── dist/                        # build output
│   ├── index.mjs, index.cjs, index.d.mts
│   ├── styles.css               # bundled Tailwind + theme (consumers import this)
│   └── theme.css                # theme only (for consumers who run Tailwind)
├── README.md
└── LICENSE
```

- **components.json**: Use **style** `base-nova` (or `base-vega`, `base-maia`, `base-lyra`, `base-mira`) so the CLI adds Base UI–powered components. For Tailwind v4, set **tailwind.config** to `""` (blank) and **tailwind.css** to our CSS entry (e.g. `src/styles.css`). Aliases point at `src/` (e.g. `@/components` → `./src/components`).
- **Build**: (1) tsdown for `src/**/*.ts(x)` → dist JS/TS; (2) Tailwind v4 CLI or PostCSS (`@tailwindcss/postcss`) to compile `src/styles.css` → `dist/styles.css` and optionally `src/theme.css` → `dist/theme.css`.

---

## 6. Using the shadcn CLI

- **Init** (once): From `packages/ui-react/`, run  
  `pnpm dlx shadcn@latest init`  
  and choose:
  - **Style**: one of the Base UI styles (e.g. **base-nova**).
  - **Base color**: e.g. neutral, zinc, slate.
  - **Tailwind v4**: leave config path blank if prompted; set CSS path to `src/styles.css`.
  - **Aliases**: match our structure (`@/components` → `src/components`, `@/lib` → `src/lib`). Ensure tsconfig has the same paths.

- **Add components**: From `packages/ui-react/`, run  
  `pnpm dlx shadcn@latest add button input label card select dialog tabs badge textarea`  
  (or add one by one). The CLI will install Base UI (and any other deps) and place components under `src/components/ui/` per `components.json`.

- **Manual tweaks**: After add, we may need to fix import paths for our package layout (e.g. `@/lib/utils` resolving to `src/lib/utils`) and ensure our CSS build includes the files the CLI added (Tailwind v4 content/source).

---

## 7. Initial Component Set (for CMS / page builder)

Add these via shadcn CLI (Base UI versions):

| Component | Purpose |
|-----------|--------|
| **Button** | Actions, submit, navigation |
| **Input** | Text fields, form inputs |
| **Label** | Form labels, accessibility |
| **Textarea** | Multi-line text |
| **Card** | Containers, block previews |
| **Select** | Dropdowns (block type, variant) |
| **Dialog** | Modals (confirm, block settings) |
| **Tabs** | Settings panels, toolbar sections |
| **Badge** | Status, counts, tags |

Optional for later: Separator, Skeleton, Table.

---

## 8. Implementation Steps (ordered)

1. **Scaffold package**
   - Create `packages/ui-react/` with `package.json` (name `@genetik/ui-react`, peer react/react-dom, scripts for build and build:css).
   - Add tsconfig (extend `@genetik/typescript-config/react-library`), tsdown.config.ts, eslint. Add `src/lib/utils.ts` with `cn()` (clsx + tailwind-merge) so shadcn components resolve.

2. **Tailwind v4 and CSS entry**
   - Install Tailwind v4 and `@tailwindcss/postcss` (or use `@tailwindcss/cli`). Create `src/styles.css` with `@import "tailwindcss";` and an initial `@theme { }` block. Add a **build:css** script that compiles `src/styles.css` → `dist/styles.css`. Optionally add `src/theme.css` (only `@theme`) → `dist/theme.css`.

3. **shadcn init with Base UI**
   - Run `pnpm dlx shadcn@latest init` in `packages/ui-react/`. Choose a **Base UI** style (e.g. base-nova), base color, Tailwind v4 (no config file; CSS path `src/styles.css`), and aliases that match our `src/` layout. This creates/updates `components.json` and may add `src/styles.css` content (CSS variables). Merge with our existing `src/styles.css` so we keep `@import "tailwindcss"` and `@theme`, and add any variables the CLI injects.

4. **Add components via shadcn CLI**
   - Run `pnpm dlx shadcn@latest add button label input textarea card select dialog tabs badge`. Fix any import paths so they work from the package root (e.g. `@/lib/utils` → our utils). Ensure `@source` or Tailwind content includes `src/components/**/*.tsx` when building CSS.

5. **Re-exports and package.json exports**
   - From `src/index.ts`, re-export all public components (and `cn` from utils). In `package.json`, set `exports` to include the main entry and the CSS files (e.g. `"./dist/styles.css"`, `"./dist/theme.css"`). Add `"files": ["dist"]` so the bundle and CSS are published.

6. **README and consumption**
   - Document: install `@genetik/ui-react`, import the bundled CSS once (`import "@genetik/ui-react/dist/styles.css"`), then import components. For advanced use, document importing `dist/theme.css` and running Tailwind v4 in the app.

7. **Genetik integration**
   - Use ui-react in the docs app or a block library: component map entries can use `<Card>`, `<Button>`, etc. from ui-react. No change to @genetik/renderer or renderer-react.

8. **Tests and CI**
   - Lint, type-check, test. Add ui-react to turbo/CI. Optional: add to Changesets when ready to publish.

---

## 9. Dependencies (draft)

- **From shadcn (Base UI style)**: the CLI will add the right Base UI packages (e.g. `@base-ui/react-*`). No Radix.
- **Tailwind v4**: `tailwindcss` ^4.x, `@tailwindcss/postcss` (or `@tailwindcss/cli`) as devDependencies for the CSS build.
- **Utils**: `clsx`, `tailwind-merge` (and optionally `class-variance-authority`) for `cn()` and variants.
- **peerDependencies**: `react` >=18, `react-dom` >=18.

Exact list will be determined when we run `shadcn init` and `shadcn add` (the CLI updates package.json).

---

## 10. Summary Checklist

- [ ] Create `packages/ui-react` with package.json, tsconfig, tsdown, eslint, `src/lib/utils.ts`.
- [ ] Set up Tailwind v4: `src/styles.css` with `@import "tailwindcss"` and `@theme`; build script → `dist/styles.css` (and optionally `dist/theme.css`).
- [ ] Run **shadcn init** with a Base UI style (e.g. base-nova); Tailwind v4 (no config, CSS path to `src/styles.css`).
- [ ] Run **shadcn add** for button, input, label, textarea, card, select, dialog, tabs, badge.
- [ ] Re-export components and CSS in package.json exports; README with install and `import "@genetik/ui-react/dist/styles.css"`.
- [ ] Use ui-react in docs app or block library to verify; add tests and CI.

Once this is done, the page builder and CMS can depend on `@genetik/ui-react`, import the bundled CSS, and use the components. We export both a **Tailwind v4–friendly theme** (dist/theme.css) and a **bundled CSS** (dist/styles.css).
