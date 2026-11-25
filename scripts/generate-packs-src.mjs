// Regenerates packs-src/<pack>/<name>.json from scripts/pack-data.mjs. Run: npm run packs:src
import { mkdir, rm, writeFile } from "node:fs/promises";
import { buildDocuments, slug } from "./pack-data.mjs";

const ROOT = new URL("../packs-src/", import.meta.url);

for (const [pack, docs] of Object.entries(buildDocuments())) {
  const dir = new URL(`${pack}/`, ROOT);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (const doc of docs) await writeFile(new URL(`${slug(doc.name)}.json`, dir), JSON.stringify(doc, null, 2) + "\n");
  console.log(`${pack}: ${docs.length}`);
}
