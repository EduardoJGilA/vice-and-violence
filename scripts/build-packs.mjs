// Compiles packs-src/<pack>/*.json into LevelDB packs/<pack>. Run: npm run build:packs
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { PACKS } from "./pack-data.mjs";

for (const pack of Object.keys(PACKS)) {
  await compilePack(`packs-src/${pack}`, `packs/${pack}`);
  console.log(`built packs/${pack}`);
}
