// Pure rules logic: no Foundry globals, testable with plain node (test/logic.test.mjs).

export const RANKS = ["novice", "apprentice", "journeyman", "adept", "wizard", "master"];

/** Armour die -> armour category ("" = no armour). */
export const DIE_CATEGORY = { "": "", d2: "skimpy", d4: "light", d6: "medium", d8: "full", "2d6": "fitted" };

/** Signed term for Roll formulas: 2 -> "+ 2", -1 -> "- 1". */
export const signed = n => (n < 0 ? `- ${-n}` : `+ ${n}`);

/** Minimum d20+Smarts total to cast: 12 normally, 6 at Wizard rank, 0 (no roll) at Master. */
export const castThreshold = rank => {
  const i = RANKS.indexOf(rank);
  return i === 5 ? 0 : i === 4 ? 6 : 12;
};

/** Fuck Up Table entry (1-11) for a failed casting total. */
export const fuckUpResult = total => Math.min(11, Math.max(1, total));

/** Advanced Spells need Skimpy armour or none (and an equipped Magic Staff, checked by the actor). */
export const advancedArmourOk = category => category === "" || category === "skimpy";

/**
 * What happens to a failed Light/Death/Advanced cast.
 * A result the caster already converted is free; otherwise an equipped staff with charges absorbs it.
 */
export const resolveFailure = ({ converted, staffCharges }) =>
  converted ? "converted" : staffCharges > 0 ? "staff" : "fuckUp";

export const ABILITY_KEYS = ["smarts", "brawn", "moxie", "hotness"];

/** Weapon type -> damage die (book weapon table; bows are Ranged). */
export const WEAPON_DICE = {
  dagger: "d4", staff: "d4", "short-sword": "d4", sword: "d6", spear: "d6", hammer: "d6", axe: "d8", bow: "d8", maul: "d8", greatsword: "d10",
  crossbow: "2d8", flail: "d10", whip: "d6", caestus: "d6", halberd: "2d8", lance: "d10",
  "sacrificial-dagger": "d4", "curved-greatsword": "2d6", "bedroom-gratificator": "2d4"
};
/** Weapon material -> flat damage bonus. */
export const MATERIAL_BONUS = { none: 0, wood: 1, stone: 1, bronze: 2, iron: 2, steel: 3, glass: 3 };

/** Die and material bonus of a weapon: from its type/material when set, else from the stored values ("custom"). */
export const resolveWeapon = ({ kind, material, die, materialBonus }) => ({
  die: WEAPON_DICE[kind] ?? die,
  bonus: material in MATERIAL_BONUS && material !== "custom" ? MATERIAL_BONUS[material] : materialBonus
});

/** Stealth DCs by the alertness of the enemies. */
export const STEALTH_DC = { asleep: 3, preoccupied: 6, alert: 10 };

/** A race's free pick is valid when +plus names an ability and, if there is a penalty, minus names a different one. */
export const validateRacePick = ({ plus, minus, minusAmount }) =>
  ABILITY_KEYS.includes(plus) && (!minusAmount || (ABILITY_KEYS.includes(minus) && minus !== plus));

/**
 * Racial ability modifiers: fixed mods of every race item, plus the chosen +pickPlus / -pickMinus.
 * races: [{smarts, brawn, moxie, hotness, pickPlus, pickMinus}]; pick: {plus, minus}.
 */
export function racialMods(races, pick = {}) {
  const out = { smarts: 0, brawn: 0, moxie: 0, hotness: 0 };
  for (const r of races) {
    for (const k of ABILITY_KEYS) out[k] += r[k] ?? 0;
    if (r.pickPlus && ABILITY_KEYS.includes(pick.plus)) {
      out[pick.plus] += r.pickPlus;
      if (r.pickMinus && ABILITY_KEYS.includes(pick.minus) && pick.minus !== pick.plus) out[pick.minus] -= r.pickMinus;
    }
  }
  return out;
}

/** Death table d20: 1-10 gone, 11-15 ghost, 16-20 zombie. */
export const deathOutcome = d20 => (d20 >= 16 ? "zombie" : d20 >= 11 ? "ghost" : "gone");

/**
 * Downed bookkeeping after a LIFE update: reaching 0 from above downs the actor;
 * going above 0 while Downed recovers it (status removed, downedTurns reset).
 */
export const downedTransition = ({ life, wasUp, isDowned }) =>
  life === 0 && wasUp ? "down" : life > 0 && isDowned ? "recover" : null;

/**
 * Turn-order score (higher acts first).
 * Preemptive first, Reactive last, Interspersed/Rapid right after the best player,
 * Constant Daydreaming dead last.
 * Rapid is not duplicated in the tracker: VVCombat reminds the GM after each player's turn.
 */
export function initiativeScore({ keyword, initiative, daydream }, topPlayer) {
  if (daydream) return -1e12;
  switch (keyword) {
    case "preemptive": return 1e9;
    case "reactive": return -1e9;
    case "interspersed":
    case "rapid": return topPlayer - 0.001;
    default: return initiative ?? 0;
  }
}
