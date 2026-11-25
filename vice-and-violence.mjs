import { CharacterData, NpcData } from "./module/data/actor.mjs";
import * as items from "./module/data/item.mjs";
import { VVActor } from "./module/documents/actor.mjs";
import { VVCombat } from "./module/documents/combat.mjs";
import { VVActorSheet, VVItemSheet } from "./module/sheets.mjs";
import { registerHooks } from "./module/hooks.mjs";
import { STATUSES } from "./module/config.mjs";

const SYSTEM = "vice-and-violence";

Hooks.once("init", () => {
  CONFIG.Actor.documentClass = VVActor;
  CONFIG.Combat.documentClass = VVCombat;
  CONFIG.Combat.initiative = { formula: "1d20", decimals: 0 };

  CONFIG.Actor.dataModels = { character: CharacterData, npc: NpcData };
  CONFIG.Item.dataModels = {
    weapon: items.WeaponData,
    armour: items.ArmourData,
    staff: items.StaffData,
    feat: items.FeatData,
    spell: items.SpellData,
    class: items.ClassData,
    race: items.RaceData,
    birthsign: items.BirthsignData,
    vice: items.ViceData,
    gear: items.GearData
  };

  const known = new Set(Object.values(CONFIG.statusEffects).map(e => e.id));
  for (const [id, img] of STATUSES) {
    if (known.has(id)) continue;
    CONFIG.statusEffects.push({ id, name: `VV.Status.${id}`, img, description: `<p>${game.i18n.localize(`VV.StatusDesc.${id}`)}</p>` });
  }

  const { DocumentSheetConfig } = foundry.applications.apps;
  DocumentSheetConfig.registerSheet(Actor, SYSTEM, VVActorSheet, { types: ["character", "npc"], makeDefault: true });
  DocumentSheetConfig.registerSheet(Item, SYSTEM, VVItemSheet, { makeDefault: true });

  game.settings.register(SYSTEM, "sheetTheme", {
    name: "VV.Setting.theme.name",
    hint: "VV.Setting.theme.hint",
    scope: "client",
    config: true,
    type: String,
    choices: { auto: "VV.Setting.theme.auto", light: "VV.Setting.theme.light", dark: "VV.Setting.theme.dark" },
    default: "auto",
    onChange: () => { for (const app of foundry.applications.instances.values()) if (app.element?.classList.contains("vice-and-violence")) app.render(); }
  });

  registerHooks();
});
