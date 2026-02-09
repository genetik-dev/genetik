# @genetik/ui-react

React design system for the Genetik ecosystem: Base UI + Tailwind v4 + shadcn-style components. Used by the page builder / CMS UI and by preconfigured Genetik blocks.

## Install

```bash
pnpm add @genetik/ui-react
```

## Usage

1. **Import the bundled CSS** (one-time in your app root, e.g. `main.tsx` or `_app.tsx`):

   ```ts
   import "@genetik/ui-react/dist/styles.css";
   ```

2. **Import components**:

   ```tsx
   import { Button, Card, Input, Label } from "@genetik/ui-react";

   export function MyForm() {
     return (
       <Card>
         <CardHeader>
           <CardTitle>Sign in</CardTitle>
         </CardHeader>
         <CardContent>
           <Label htmlFor="email">Email</Label>
           <Input id="email" type="email" />
           <Button>Submit</Button>
         </CardContent>
       </Card>
     );
   }
   ```

## Theme-only (Tailwind v4 in your app)

If you run Tailwind v4 in your own app and want to use our design tokens:

```css
@import "tailwindcss";
@import "@genetik/ui-react/dist/theme.css";
```

Then use our components as above; your Tailwind build will need to scan `node_modules/@genetik/ui-react/dist/**/*.js` (or the package source) for class names.

## Components

- **Button**, **Input**, **Label**, **Textarea** — forms
- **Card** (CardHeader, CardTitle, CardDescription, CardContent, CardFooter, etc.)
- **Select** (SelectTrigger, SelectContent, SelectItem, etc.)
- **Dialog** (DialogTrigger, DialogContent, DialogHeader, etc.)
- **Tabs** (TabsList, TabsTrigger, TabsContent)
- **Badge**

Plus the `cn()` utility for merging class names.

## Development

From the repo root:

```bash
pnpm --filter @genetik/ui-react build
pnpm --filter @genetik/ui-react dev   # watch JS
```

The CSS is built with the JS (`pnpm build` runs both). To add more components, from `packages/ui-react` run:

```bash
pnpm dlx shadcn@latest add <component-name>
```

Then re-export from `src/index.ts`.
