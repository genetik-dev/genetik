#!/usr/bin/env node
import { mkdir, cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname);
const dist = join(root, "dist");
const src = join(root, "src");

await mkdir(dist, { recursive: true });

execSync(
  `npx @tailwindcss/cli -i "${join(src, "styles.css")}" -o "${join(dist, "styles.css")}"`,
  { stdio: "inherit", cwd: root }
);

await cp(join(src, "theme.css"), join(dist, "theme.css"));
