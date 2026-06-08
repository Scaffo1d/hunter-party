import * as esbuild from "esbuild";
import { cpSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const engineData = join(root, "../../packages/game-engine/data");
const distData = join(root, "dist/game-engine-data");

mkdirSync(distData, { recursive: true });
for (const file of ["board.graph.json", "bosses.json", "equipment.json", "relics.json", "opportunity.json", "tiles.json"]) {
  cpSync(join(engineData, file), join(distData, file));
}

await esbuild.build({
  entryPoints: [join(root, "src/index.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: join(root, "dist/index.js"),
  packages: "external",
  alias: {
    "@hunter-party/game-engine/types": join(root, "../../packages/game-engine/src/game/types.ts"),
    "@hunter-party/game-engine/state": join(root, "../../packages/game-engine/src/game/state.ts"),
    "@hunter-party/game-engine/actions": join(root, "../../packages/game-engine/src/game/actions.ts"),
  },
  loader: { ".json": "json" },
});

console.log("Server built to dist/index.js");
