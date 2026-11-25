const { SchemaField, NumberField, StringField, BooleanField, ArrayField, HTMLField } = foundry.data.fields;

const int = (initial, min, max) => new NumberField({ required: true, nullable: false, integer: true, initial, min, max });
const pool = (value, max) => new SchemaField({ value: int(value, 0), max: int(max, 0) });
const ability = () => int(0, -4, 7);

export const ARMOUR_DICE = ["", "d2", "d4", "d6", "d8", "2d6"];
export const INITIATIVES = ["preemptive", "interspersed", "reactive", "rapid"];

class BaseActorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      smarts: ability(),
      brawn: ability(),
      moxie: ability(),
      hotness: ability(),
      // life.max = 5 + d6 + moxie, rolled once via Actor#rollLife(); level-ups add to max by hand.
      life: pool(5, 5),
      exertion: pool(3, 3),
      spellUses: pool(0, 0),
      armourSave: new StringField({ required: true, blank: true, initial: "", choices: ARMOUR_DICE }),
      armourBonus: int(0, 0, 20),
      refractoryPeriod: int(60, 0), // minutes
      level: int(0, 0, 10),
      jade: int(0, 0),
      combatActions: new SchemaField({ value: int(1, 0, 1), max: int(1, 1, 1) }),
      tacticalActions: new SchemaField({ value: int(2, 0, 2), max: int(2, 2, 2) }),
      // fuckUpTable[n - 1] === true -> Fuck Up result n (1-11) is converted into a successful cast.
      fuckUpTable: new ArrayField(new BooleanField(), { initial: () => Array(11).fill(false) }),
      // Player-chosen racial bonus (Centaur +1, Otherling +2/-1): abilities chosen, applied on top of the base values.
      racePlus: new StringField({ initial: "", blank: true, choices: ["", "smarts", "brawn", "moxie", "hotness"] }),
      raceMinus: new StringField({ initial: "", blank: true, choices: ["", "smarts", "brawn", "moxie", "hotness"] }),
      notes: new HTMLField(), // rich-text notes, like the Notes tab of other sheets
      inventory: new StringField({ initial: "" }), // free-text list of what the character carries
      backgroundNotes: new StringField({ initial: "" }), // character: background benefits; NPC: free notes
      downedTurns: int(0, 0, 3),
      isZombie: new BooleanField({ initial: false })
    };
  }
}

export class CharacterData extends BaseActorData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      background: new StringField({ initial: "" }),
      rations: int(4, 0),
      water: int(4, 0),
      disposition: int(0, -50, 50),
      booze: new StringField({ initial: "" }), // Booze, Drugs & Milk
      maxPartners: int(1, 0, 4), // d4, fixed for life
      abilities: new StringField({ initial: "" }) // free notes: skills, martial skills, class abilities
    };
  }
}

export class NpcData extends BaseActorData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      initiative: new StringField({ required: true, initial: "reactive", choices: INITIATIVES }),
      attackDie: new StringField({ required: true, initial: "d6", blank: false }),
      disposition: int(0, -50, 50)
    };
  }
}
