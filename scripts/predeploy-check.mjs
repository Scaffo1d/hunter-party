#!/usr/bin/env node
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "apps/server/dist/index.js",
  "apps/web/vercel.json",
  "apps/web/.vercelignore",
  "render.yaml",
  "DEPLOY.md",
  "packages/game-engine/data/board.graph.json",
  "apps/web/public/board-sketch.png",
];

let ok = true;
for (const rel of required) {
  const path = join(root, rel);
  if (!existsSync(path)) {
    console.error(`✗ missing ${rel}`);
    ok = false;
  } else {
    console.log(`✓ ${rel}`);
  }
}

if (!ok) process.exit(1);
console.log("\nPre-deploy check passed. Follow DEPLOY.md to deploy on Render + Vercel.");
