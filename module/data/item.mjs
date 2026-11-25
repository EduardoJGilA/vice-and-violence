import { RANKS, WEAPON_DICE, MATERIAL_BONUS, resolveWeapon } from "../logic.mjs";

const { NumberField, StringField, BooleanField, HTMLField } = foundry.data.fields;

const int = (initial, min, max) => new NumberField({ required: true, nullable: false, integer: true, initial, min, max });
const choice = (choices, initial = choices[0], blank = false) =>
  new StringField({ required: true, blank, initial, choices });

class BaseItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { description: new HTMLField() };
  }
}

export class WeaponData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      // kind/material pick the die and the bonus; "custom" kind or material uses the stored die / materialBonus.
      kind: choice([...Object.keys(WEAPON_DICE), "custom"], "dagger"),
      material: choice([...Object.keys(MATERIAL_BONUS), "custom"], "wood"),
      die: new StringField({ required: true, initial: "d4", blank: false }), // "d4", "2d8"...
      materialBonus: int(0, 0, 3), // Wood/Stone +1, Bronze/Iron +2, Steel/Glass +3
      range: choice(["adjacent", "nearby", "far", "distant"])
    };
  }

  prepareDerivedData() {
    const { die, bonus } = resolveWeapon(this);
    this.die = die;
    this.materialBonus = bonus;
  }
}

export class FeatData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      classType: choice(["bard", "dancer", "fighter", "thief", "paladin", "cleric", "warlock", "wizard", "blood", "martial"], "fighter"),
      requirement: new StringField({ initial: "" }) // tier, sessions, level-ups, vows or price needed to get it
    };
  }
}

export class ArmourData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      category: choice(["skimpy", "light", "medium", "full", "fitted"]),
      saveDie: choice(["d2", "d4", "d6", "d8", "2d6"]),
      bonus: int(0, 0, 10), // +1 upgrades
      stealthPenalty: int(0, 0, 20), // extra to the armour die already subtracted in Stealth
      equipped: new BooleanField({ initial: false })
    };
  }
}

export class SpellData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      school: choice(["light", "death", "utility", "blood", "advanced", "grimoire"]),
      costType: choice(["spellUses", "life"]),
      cost: int(1, 0, 50),
      minRank: choice(["", ...RANKS], "", true) // Advanced spells: minimum Wizard rank
    };
  }
}

export class StaffData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      // Each charge absorbs one Fuck Up (a "+10 Staff" has max 10; costs 10j per charge).
      charges: new foundry.data.fields.SchemaField({ value: int(0, 0), max: int(0, 0) }),
      equipped: new BooleanField({ initial: false })
    };
  }
}

export class ClassData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      classType: choice(["bard", "dancer", "fighter", "thief", "paladin", "cleric", "warlock", "wizard", "blood"]),
      // Wizard: 1 Novice ... 6 Master. Bard: Bard Proficiency (1-20). Others: skills/tiers learned.
      learningLevel: int(0, 0, 20),
      skills: new StringField({ initial: "" }) // comma-separated
    };
  }
}

export class RaceData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      smarts: int(0, -3, 3),
      brawn: int(0, -3, 3),
      moxie: int(0, -3, 3),
      hotness: int(0, -3, 3),
      // Player-chosen bonuses applied by the actor sheet when the race is dropped: +pickPlus to one
      // ability and, if pickMinus > 0, -pickMinus to a different one (Centaur 1/0, Otherling 2/1).
      pickPlus: int(0, 0, 3),
      pickMinus: int(0, 0, 3)
    };
  }
}

export class BirthsignData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      boonA: new StringField({ initial: "" }),
      boonB: new StringField({ initial: "" }),
      chosen: choice(["", "a", "b"], "", true)
    };
  }
}

export class ViceData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      key: new StringField({ initial: "" }), // slug, e.g. "constant-daydreaming"; falls back to the item name
      effect: new StringField({ initial: "" })
    };
  }
}

export class GearData extends BaseItemData {
  static defineSchema() {
    return { ...super.defineSchema(), quantity: int(1, 0), price: int(0, 0) };
  }
}
