// Run: node test/logic.test.mjs
import assert from "node:assert/strict";
import {
  castThreshold, fuckUpResult, deathOutcome, initiativeScore, signed,
  advancedArmourOk, DIE_CATEGORY, resolveFailure, downedTransition,
  validateRacePick, racialMods, resolveWeapon, WEAPON_DICE, MATERIAL_BONUS, STEALTH_DC
} from "../module/logic.mjs";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { VICES, viceForRoll } from "../module/data/vices.mjs";
import { PACKS, buildDocuments, stableId } from "../scripts/pack-data.mjs";
import { STATUSES } from "../module/config.mjs";

assert.equal(signed(-2), "- 2");
assert.equal(signed(0), "+ 0");

// casting thresholds and Fuck Up index
assert.equal(castThreshold(""), 12);
assert.equal(castThreshold("adept"), 12);
assert.equal(castThreshold("wizard"), 6);
assert.equal(castThreshold("master"), 0);
assert.equal(fuckUpResult(-3), 1);
assert.equal(fuckUpResult(7), 7);
assert.equal(fuckUpResult(11), 11);

// death table
assert.deepEqual([1, 10, 11, 15, 16, 20].map(deathOutcome), ["gone", "gone", "ghost", "ghost", "zombie", "zombie"]);

// Advanced Spells: Skimpy or no armour only (also holds at Master: the check ignores rank)
assert.deepEqual(Object.values(DIE_CATEGORY).map(advancedArmourOk), [true, true, false, false, false, false]);
assert.equal(advancedArmourOk(DIE_CATEGORY.d2), true);
assert.equal(advancedArmourOk(DIE_CATEGORY["2d6"]), false);

// failed cast: free converted result > staff charge > Fuck Up Table
assert.equal(resolveFailure({ converted: true, staffCharges: 5 }), "converted");
assert.equal(resolveFailure({ converted: false, staffCharges: 1 }), "staff");
assert.equal(resolveFailure({ converted: false, staffCharges: 0 }), "fuckUp");

// Downed: 0 from above downs; healing above 0 recovers (status + downedTurns reset); no-ops otherwise
assert.equal(downedTransition({ life: 0, wasUp: true, isDowned: false }), "down");
assert.equal(downedTransition({ life: 0, wasUp: false, isDowned: true }), null);
assert.equal(downedTransition({ life: 1, wasUp: false, isDowned: true }), "recover");
assert.equal(downedTransition({ life: 9, wasUp: true, isDowned: false }), null);
assert.equal(downedTransition({ life: undefined, wasUp: undefined, isDowned: true }), null);

// Vice table: d50 fully and contiguously covered, unique names, daydreaming slug matches the combat check
for (let n = 1; n <= 50; n++) assert.ok(viceForRoll(n), `no vice for ${n}`);
assert.equal(viceForRoll(0), undefined);
assert.equal(viceForRoll(51), undefined);
assert.equal(new Set(VICES.map(v => v.name)).size, VICES.length);
assert.equal(viceForRoll(13).name.toLowerCase().replace(/\s+/g, "-"), "constant-daydreaming");
assert.equal(viceForRoll(14).name, "Constant Daydreaming");

// initiative order
const top = 15;
const order = [
  ["pre", { keyword: "preemptive" }],
  ["p1", { keyword: "player", initiative: 15 }],
  ["inter", { keyword: "interspersed" }],
  ["rapid", { keyword: "rapid" }],
  ["p2", { keyword: "player", initiative: 9 }],
  ["react", { keyword: "reactive" }],
  ["lazy", { keyword: "player", initiative: 20, daydream: true }]
].sort((a, b) => initiativeScore(b[1], top) - initiativeScore(a[1], top)).map(([n]) => n);
assert.deepEqual(order.filter(n => n !== "rapid" && n !== "inter"), ["pre", "p1", "p2", "react", "lazy"]);
assert.ok(order.indexOf("inter") === order.indexOf("p1") + 1 || order.indexOf("rapid") === order.indexOf("p1") + 1);
assert.ok(order.indexOf("rapid") < order.indexOf("p2") && order.indexOf("inter") < order.indexOf("p2"));

// ---- compendium sources ----
const docs = buildDocuments();
const system = JSON.parse(readFileSync(new URL("../system.json", import.meta.url)));
const ENUM = {
  school: ["light", "death", "utility", "blood", "advanced", "grimoire"],
  costType: ["spellUses", "life"],
  range: ["adjacent", "nearby", "far", "distant"],
  category: ["skimpy", "light", "medium", "full", "fitted"],
  saveDie: ["d2", "d4", "d6", "d8", "2d6"],
  rank: ["", "novice", "apprentice", "journeyman", "adept", "wizard", "master"],
  classType: ["bard", "dancer", "fighter", "thief", "paladin", "cleric", "warlock", "wizard", "blood"]
};

// system.json declares exactly these packs, with matching paths, and the stylesheet exists
assert.deepEqual(system.packs.map(p => p.name).sort(), Object.keys(PACKS).sort());
for (const p of system.packs) assert.equal(p.path, `packs/${p.name}`);
for (const css of system.styles) assert.ok(existsSync(new URL(`../${css}`, import.meta.url)), css);

// ids: 16 alnum chars, unique across all packs, deterministic
const { tables: rollTables, creatures: actorDocs, ...itemPacks } = docs;
const all = Object.values(itemPacks).flat();
assert.equal(new Set(all.map(d => d._id)).size, all.length);
for (const d of all) {
  assert.match(d._id, /^[0-9A-Za-z]{16}$/);
  assert.equal(d._key, `!items!${d._id}`);
  assert.ok(d.system.description.length > 10, d.name);
}
assert.equal(stableId("races:Elf"), stableId("races:Elf"));

// races: the 12 d12 races plus 4 Dragonkin sub-races, mods inside the model range
const races = Object.fromEntries(docs.races.map(d => [d.name, d.system]));
assert.deepEqual(["Goblin", "Dragonkin", "Elf", "Human", "Orc", "Dwarf", "Centaur", "Satyr", "Dweller", "Relmer", "Alloyan", "Otherling"].filter(n => !(n in races)), []);
assert.equal(docs.races.length, 16);
for (const r of Object.values(races)) for (const k of ["smarts", "brawn", "moxie", "hotness"]) assert.ok(Math.abs(r[k]) <= 3);
assert.deepEqual([races.Orc.smarts, races.Orc.brawn], [-1, 2]);
assert.deepEqual([races.Dwarf.hotness, races.Dwarf.moxie], [-1, 2]);
assert.deepEqual([races.Alloyan.smarts, races.Alloyan.moxie, races.Alloyan.hotness], [-1, 1, 1]);
assert.equal(races.Quetzian.smarts, 2);

// birthsigns: 6 with two boons each
assert.equal(docs.birthsigns.length, 6);
for (const b of docs.birthsigns) assert.ok(b.system.boonA && b.system.boonB);

// weapons: 10 base x 6 materials + 9 specials; material bonus per the book
assert.equal(docs.weapons.length, 10 * 6 + 9);
const weapons = Object.fromEntries(docs.weapons.map(d => [d.name, d.system]));
assert.deepEqual(["die", "materialBonus", "range"].map(k => weapons["Steel Greatsword"][k]), ["d10", 3, "adjacent"]);
assert.equal(weapons["Wood Dagger"].materialBonus, 1);
assert.equal(weapons["Iron Axe"].materialBonus, 2);
assert.equal(weapons["Glass Bow"].range, "far");
for (const w of docs.weapons) {
  assert.match(w.system.die, /^\d*d\d+$/);
  assert.ok(ENUM.range.includes(w.system.range), w.name);
}

// armours: Skimpy..Fitted with the book's save dice
assert.deepEqual(docs.armours.map(a => [a.system.category, a.system.saveDie]),
  [["skimpy", "d2"], ["light", "d4"], ["medium", "d6"], ["full", "d8"], ["fitted", "2d6"]]);
for (const a of docs.armours) assert.ok(ENUM.category.includes(a.system.category) && ENUM.saveDie.includes(a.system.saveDie));

// spells: valid enums, unique names, school counts, Advanced gated and costed
const spells = docs.spells;
assert.equal(new Set(spells.map(s => s.name)).size, spells.length);
for (const s of spells) {
  assert.ok(ENUM.school.includes(s.system.school) && ENUM.costType.includes(s.system.costType) && ENUM.rank.includes(s.system.minRank), s.name);
  assert.ok(Number.isInteger(s.system.cost) && s.system.cost >= 0 && s.system.cost <= 50, s.name);
}
const bySchool = school => spells.filter(s => s.system.school === school);
assert.deepEqual(["light", "death", "utility", "advanced", "grimoire"].map(k => bySchool(k).length), [10, 10, 20, 12, 0]);
for (const s of bySchool("blood")) assert.deepEqual([s.system.costType, s.system.cost], ["life", 0]);
for (const s of bySchool("advanced")) assert.ok(s.system.minRank && s.system.cost >= 3);
assert.equal(bySchool("advanced").find(s => s.name === "Clone").system.cost, 20);

// grimoires: the 40 book spells, all costed, ritual-only
const grim = docs.grimoires;
assert.equal(grim.length, 40);
assert.equal(new Set(grim.map(g => g.name)).size, 40);
for (const g of grim) {
  assert.equal(g.system.school, "grimoire");
  assert.ok(g.system.cost >= 1 && g.system.cost <= 20, g.name);
  assert.match(g.system.description, /Requires: .+, \d+ Spell Uses\. Lasts: /);
}
assert.equal(grim.find(g => g.name === "Prestidigitation").system.cost, 1);
assert.equal(grim.find(g => g.name === "Lovely Little Cottage").system.cost, 20);
assert.equal(Math.max(...grim.map(g => g.system.cost)), 20);

// race picks (Centaur +1; Otherling +2/-1) and the pure helper that applies them
assert.deepEqual([races.Centaur.pickPlus, races.Centaur.pickMinus, races.Otherling.pickPlus, races.Otherling.pickMinus], [1, 0, 2, 1]);
assert.equal(docs.races.filter(r => r.system.pickPlus).length, 2);
assert.equal(validateRacePick({ plus: "smarts", minusAmount: 0 }), true);
assert.equal(validateRacePick({ plus: "hotness", minus: "brawn", minusAmount: 1 }), true);
assert.equal(validateRacePick({ plus: "smarts", minus: "smarts", minusAmount: 1 }), false);
assert.equal(validateRacePick({ plus: "luck", minusAmount: 0 }), false);
assert.equal(validateRacePick({ plus: "smarts", minusAmount: 1 }), false);

// racial modifiers: fixed mods of the race items plus the chosen pick
const orc = races.Orc, centaur = races.Centaur, otherling = races.Otherling;
assert.deepEqual(racialMods([orc]), { smarts: -1, brawn: 2, moxie: 0, hotness: 0 });
assert.deepEqual(racialMods([centaur], { plus: "moxie" }), { smarts: 0, brawn: 0, moxie: 1, hotness: 0 });
assert.deepEqual(racialMods([otherling], { plus: "hotness", minus: "brawn" }), { smarts: 0, brawn: -1, moxie: 0, hotness: 2 });
assert.deepEqual(racialMods([otherling], { plus: "hotness", minus: "hotness" }), { smarts: 0, brawn: 0, moxie: 0, hotness: 2 }); // invalid penalty ignored
assert.deepEqual(racialMods([centaur]), { smarts: 0, brawn: 0, moxie: 0, hotness: 0 }); // no pick yet

// weapons: type + material give die and bonus; custom keeps the stored values
assert.deepEqual(resolveWeapon({ kind: "sword", material: "iron", die: "d4", materialBonus: 0 }), { die: "d6", bonus: 2 });
assert.deepEqual(resolveWeapon({ kind: "greatsword", material: "glass", die: "d4", materialBonus: 0 }), { die: "d10", bonus: 3 });
assert.deepEqual(resolveWeapon({ kind: "custom", material: "custom", die: "2d8", materialBonus: 1 }), { die: "2d8", bonus: 1 });
assert.deepEqual(resolveWeapon({ kind: "halberd", material: "none", die: "d4", materialBonus: 3 }), { die: "2d8", bonus: 0 });
for (const w of docs.weapons) {
  const r = resolveWeapon(w.system);
  assert.equal(r.die, w.system.die, w.name);
  assert.equal(r.bonus, w.system.materialBonus, w.name);
  assert.ok(w.system.kind in WEAPON_DICE, w.name);
  assert.ok(w.system.material in MATERIAL_BONUS, w.name);
}
assert.deepEqual(STEALTH_DC, { asleep: 3, preoccupied: 6, alert: 10 });

// feats: every class has some, names unique, valid class types
const feats = docs.feats;
assert.equal(new Set(feats.map(f => f.name)).size, feats.length);
const FEAT_CLASSES = [...ENUM.classType, "martial"];
for (const f of feats) assert.ok(FEAT_CLASSES.includes(f.system.classType) && f.system.requirement, f.name);
for (const c of ["bard", "dancer", "fighter", "thief", "paladin", "cleric", "warlock", "wizard", "blood", "martial"]) {
  assert.ok(feats.some(f => f.system.classType === c), `no feats for ${c}`);
}
assert.equal(feats.filter(f => f.system.classType === "warlock").length, 18); // 6 patrons x 3 abilities
assert.equal(feats.filter(f => f.system.classType === "bard").length, 7);

// classes: all 9 types, once each
assert.deepEqual(docs.classes.map(c => c.system.classType).sort(), [...ENUM.classType].sort());

// generated JSON sources are in sync with the data module
for (const [pack, list] of Object.entries(docs)) {
  const dir = new URL(`../packs-src/${pack}/`, import.meta.url);
  assert.equal(readdirSync(dir).length, list.length, `${pack}: run npm run packs:src`);
}

// creatures: the mimic NPC, with art that exists on disk and ids unique across everything
const mimic = actorDocs.find(a => a.name === "Treasure Mimic");
assert.equal(mimic.type, "npc");
assert.match(mimic._id, /^[0-9A-Za-z]{16}$/);
assert.equal(mimic._key, `!actors!${mimic._id}`);
assert.ok(existsSync(new URL(`../${mimic.img.replace("systems/vice-and-violence/", "")}`, import.meta.url)), "mimic art missing");
assert.equal(mimic.prototypeToken.texture.src, mimic.img);
assert.match(mimic.system.backgroundNotes, /impervious to damage/);
assert.match(mimic.system.backgroundNotes, /50 rations/);
assert.ok(!all.some(d => d._id === mimic._id));
assert.ok(system.packs.some(p => p.name === "creatures" && p.type === "Actor"));

// roll tables: d100 supplies with 100 contiguous results, d6 pets, ids unique, v14 text-result shape
const supplies = rollTables.find(t => t.name === "Adventuring Supplies");
const pets = rollTables.find(t => t.name === "Pets");
assert.equal(supplies.formula, "1d100");
assert.equal(supplies.results.length, 100);
assert.deepEqual(supplies.results.map(r => r.range[0]), Array.from({ length: 100 }, (_, i) => i + 1));
assert.equal(pets.formula, "1d6");
assert.equal(pets.results.length, 6);
for (const t of rollTables) {
  assert.match(t._id, /^[0-9A-Za-z]{16}$/);
  assert.equal(t._key, `!tables!${t._id}`);
  for (const r of t.results) {
    assert.equal(r._key, `!tables.results!${t._id}.${r._id}`);
    assert.equal(r.type, "text");
    assert.deepEqual(r.range, [r.range[0], r.range[0]]);
    assert.ok(r.description.length > 8);
  }
}
const fuckUps = rollTables.find(t => t.name === "Fuck Up Table");
assert.equal(fuckUps.formula, "1d11");
assert.equal(fuckUps.results.length, 11);
const lang = JSON.parse(readFileSync(new URL("../lang/en.json", import.meta.url)));
for (let n = 1; n <= 11; n++) {
  assert.ok(lang[`VV.FuckUp.${n}`], `lang VV.FuckUp.${n}`);
  assert.equal(fuckUps.results[n - 1].range[0], n);
  assert.ok(fuckUps.results[n - 1].description.includes(lang[`VV.FuckUp.${n}`].split("'")[0].replace(/&/g, "&amp;")), `table text ${n}`);
}
assert.equal(new Set(rollTables.flatMap(t => t.results.map(r => r._id))).size, 117);
const plain = r => r.description.replace(/<[^>]*>/g, "").replace(/&quot;|&#39;/g, "").replace(/&amp;/g, "&");
const sup = n => plain(supplies.results[n - 1]);
assert.match(sup(40), /forearm shield \(\+1 Moxie\)/);
assert.match(sup(62), /d100 extra jade/);
assert.match(sup(99), /d10 extra rations/);
assert.match(sup(100), /roll a d6 on the Pets table/);
assert.match(plain(pets.results[5]), /Crapdragon/);
assert.ok(system.packs.some(p => p.name === "tables" && p.type === "RollTable"));

// statuses: unique ids, each with a name and rules text in the lang file, the book's full list present
const lang2 = JSON.parse(readFileSync(new URL("../lang/en.json", import.meta.url)));
const statusIds = STATUSES.map(([id]) => id);
assert.equal(new Set(statusIds).size, statusIds.length);
const CORE_IDS = new Set(["prone", "burning", "stun", "restrain"]); // v14 supplies the name for these
for (const id of statusIds) {
  if (!CORE_IDS.has(id)) assert.ok(lang2[`VV.Status.${id}`], `name for status ${id}`);
  assert.ok(lang2[`VV.StatusDesc.${id}`]?.length > 20, `description for status ${id}`);
}
for (const id of ["downed", "knocked", "prone", "poisoned", "drunk", "filthy", "burning", "stun", "terrified", "charmed", "horny", "blinded", "restrain", "berserk", "dehydrated", "starving", "exhausted"]) {
  assert.ok(statusIds.includes(id), `missing status ${id}`);
}
assert.ok(!statusIds.includes("restrained"), "restrained duplicates the core restrain status");
assert.match(lang2["VV.StatusDesc.horny"], /Moxie or 1 Smarts every 12 hours/);
assert.ok(lang2["VV.Tab.notes"]);

console.log("logic ok");
