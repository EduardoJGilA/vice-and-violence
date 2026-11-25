// Source data for the system compendia (pure module, no Foundry globals).
// Mechanics come from SISTEMA_CORE.md; a few weapon/spell details that the summary omits come from the
// book pages read earlier (weapons table pag_092, Utility spells pag_061, Advanced spells pag_060).
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const LANG = JSON.parse(readFileSync(new URL("../lang/en.json", import.meta.url), "utf8"));

export const SYSTEM_ID = "vice-and-violence";

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const para = text => `<p>${esc(text)}</p>`;

const B62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
/** Deterministic 16-char Foundry id so re-generating never churns ids. */
export function stableId(key) {
  let n = BigInt("0x" + createHash("sha256").update(key).digest("hex"));
  let id = "";
  for (let i = 0; i < 16; i++, n /= 62n) id += B62[Number(n % 62n)];
  return id;
}

export const slug = name => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const entry = (pack, name, type, system, desc) => {
  const _id = stableId(`${pack}:${name}`);
  return {
    _id,
    _key: `!items!${_id}`,
    name,
    type,
    img: "icons/svg/item-bag.svg",
    system: { description: para(desc), ...system },
    effects: [],
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {}
  };
};

// ---------- Races (d12) ----------
const mods = (smarts = 0, brawn = 0, moxie = 0, hotness = 0) => ({ smarts, brawn, moxie, hotness });
const pick = (pickPlus, pickMinus = 0) => ({ ...mods(), pickPlus, pickMinus });
const RACES = [
  ["Goblin", mods(0, 0, 1, 0), "d12 result 1."],
  ["Dragonkin", mods(), "d12 result 2. Roll a d4 for a sub-race (Dracolithian, Quetzian, Wyvernian, Koboldian) and use that item's modifiers instead."],
  ["Elf", mods(0, 0, 0, 1), "d12 result 3."],
  ["Human", mods(1), "d12 result 4."],
  ["Orc", mods(-1, 2), "d12 result 5."],
  ["Dwarf", mods(0, 0, 2, -1), "d12 result 6."],
  ["Centaur", pick(1), "d12 result 7. +1 to one Ability of your choice (asked when dropped on a sheet)."],
  ["Satyr", mods(0, 0, -1, 2), "d12 result 8."],
  ["Dweller", mods(2, -1), "d12 result 9."],
  ["Relmer", mods(1, 0, -1, 1), "d12 result 10."],
  ["Alloyan", mods(-1, 0, 1, 1), "d12 result 11."],
  ["Otherling", pick(2, 1), "d12 result 12. +2 to one Ability and -1 to another (asked when dropped on a sheet)."],
  ["Dracolithian", mods(-1, 1, 1), "Dragonkin sub-race (d4 = 1)."],
  ["Quetzian", mods(2, 0, -1), "Dragonkin sub-race (d4 = 2)."],
  ["Wyvernian", mods(1, -1, 0, 1), "Dragonkin sub-race (d4 = 3)."],
  ["Koboldian", mods(0, 1, -1, 1), "Dragonkin sub-race (d4 = 4)."]
];

// ---------- Birthsigns (d6, pick one of two Boons) ----------
const BIRTHSIGNS = [
  ["Ran'di", "Roll for a Light Magic spell", "Sex is always considered Great or better"],
  ["Du'di", "Immune to poison", "Roll for a Death Magic spell"],
  ["Tri'qi", "+1 Exertion Uses", "Permanent +1 Moxie"],
  ["For'ai", "+3 LIFE every Level Up", "Permanent +1 Brawn"],
  ["Fi'dli", "Roll for a Death Magic spell", "Roll for a Light Magic spell"],
  ["Sais'i", "Roll for two Light Magic spells", "Permanent +2 Hotness"]
];

// ---------- Weapons ----------
const BASE_WEAPONS = [
  ["Dagger", "d4", 25, "adjacent", ""],
  ["Staff", "d4", 35, "adjacent", ""],
  ["Short Sword", "d4", 30, "adjacent", ""],
  ["Sword", "d6", 40, "adjacent", ""],
  ["Spear", "d6", 50, "adjacent", ""],
  ["Hammer", "d6", 50, "adjacent", ""],
  ["Axe", "d8", 60, "adjacent", ""],
  ["Bow", "d8", 80, "far", "Ranged."],
  ["Maul", "d8", 80, "adjacent", ""],
  ["Greatsword", "d10", 85, "adjacent", ""]
];
const MATERIALS = [["Wood", 1, 10], ["Stone", 1, 10], ["Bronze", 2, 30], ["Iron", 2, 30], ["Steel", 3, 70], ["Glass", 3, 70]];
const SPECIAL_WEAPONS = [
  ["Crossbow", "2d8", 90, "far", "Ranged. Costs 1 Tactical Action to reload."],
  ["Flail", "d10", 75, "adjacent", "If the user rolls a 1 they hit themselves in the groin for d6; on a 10 it deals double damage."],
  ["Whip", "d6", 60, "distant", "Ranged. Deals 2d6 damage to Distant targets."],
  ["Caestus", "d6", 75, "adjacent", "After attacking with your Combat Action you may attack again with each Tactical Action."],
  ["Halberd", "2d8", 100, "nearby", "Can attack Nearby targets, or attack past allies."],
  ["Lance", "d10", 90, "adjacent", "Deals 2d10 when mounted."],
  ["Sacrificial Dagger", "d4", 65, "adjacent", "Adds d4 to Blood Magic spells without losing Life, OR adds the damage dealt to a Vampire's Blood Gauge."],
  ["Curved Greatsword", "2d6", 100, "adjacent", "Grants the Cleave martial skill while in use."],
  ["Bedroom Gratificator", "2d4", 80, "adjacent", "On a roll of 8 the target is knocked prone. Adds d6 to all Sex rolls."]
];

const weapon = (name, die, materialBonus, range, desc, kind = "custom", material = "custom") =>
  ["weapons", name, "weapon", { kind, material, die, materialBonus, range }, desc];
const WEAPONS = [
  ...BASE_WEAPONS.flatMap(([name, die, price, range, note]) =>
    MATERIALS.map(([mat, bonus, extra]) =>
      weapon(`${mat} ${name}`, die, bonus, range, `${die}+${bonus} damage plus Brawn. Price ${price + extra}j. ${note}`.trim(), slug(name), mat.toLowerCase()))),
  ...SPECIAL_WEAPONS.map(([name, die, price, range, note]) => weapon(name, die, 0, range, `${die} damage plus Brawn. Price ${price}j. ${note}`, slug(name), "none"))
];

// ---------- Armours ----------
const ARMOURS = [
  ["Skimpy Armour", "skimpy", "d2", "30j. Barely covered: great for stealth, bad for being stabbed."],
  ["Light Armour", "light", "d4", "65j. Joints protected, little else."],
  ["Medium Armour", "medium", "d6", "100j."],
  ["Full Armour", "full", "d8", "300j. Arms, legs and torso well covered; noisy."],
  ["Fitted Armour", "fitted", "2d6", "1000-1500j plus 1 Downtime session to be measured. Cheaper for Dwarfs, Dwellers and Goblins. Reduced to Medium while the wearer carries eggs."]
].map(([name, category, saveDie, desc]) => ["armours", name, "armour", { category, saveDie, bonus: 0, stealthPenalty: 0, equipped: false }, `${desc} Armour Save ${saveDie}; +1 per upgrade (75j).`]);

// ---------- Spells ----------
const spell = (name, school, desc, { cost = 1, costType = "spellUses", minRank = "" } = {}) =>
  ["spells", name, "spell", { school, costType, cost, minRank }, desc];

const LIGHT = [
  ["Heal", "Level 1. 2d8 Life to one target. Can tame wounded animals or convince humanoid enemies to stop fighting."],
  ["Group Heal", "Level 1. 1d8 Life to d4 targets. Can pacify bar brawls or cult bloodletting rituals."],
  ["Shield", "Level 1. 2d8 bonus Armour to 1 target for 1 round. Can be cast on opposite walls to create a magic barrier."],
  ["Charm", "Level 1. Turns 1 hostile enemy to your side for 1d8 rounds; adds 2d8 to a Disposition check. The target obeys your commands."],
  ["Sleep", "Level 1. The target misses their turn for d6 rounds; any damage wakes them. Keeps a sleeper asleep (Stealth checks auto-succeed)."],
  ["Sunbeam", "Level 5. 2d8 damage to an Adjacent enemy and 1d8 to a Far or Distant enemy. Both targets are Blinded for 1 turn."],
  ["Enchant Weapon / Armour", "Level 5. Adds d6 + your Level to your or an ally's weapon damage, or to armour. Roll the d6 after a successful cast. Lasts 24 hours."],
  ["Resurrect", "Level 5. Revive a recently dead humanoid at full health as a zombie. The target might not appreciate this."],
  ["Entrall", "Level 5. Turns 1 hostile target to your side. Every 24 hours the target can resist (DC12). It obeys your commands."],
  ["Big Sleep", "Level 5. Applies the Sleep spell to 2d6 targets."]
].map(([n, d]) => spell(n, "light", d));

const DEATH = [
  ["Fireball", "Level 1. 3d6 damage to one target and the Burning status. Can set fire to flammable objects."],
  ["Lightning", "Level 1. 2d6 damage to d4 targets. Can electrify puddles and power magical devices."],
  ["Force Pull", "Level 1. 2d4 damage to one target, pulling it towards you and making you its target. Can pickpocket or undress an unarmoured target."],
  ["Force Push", "Level 1. 2d4 damage to one target, pushing it away and making it Prone. Can trigger traps or lift willing humanoids to second-story windows."],
  ["Paralyse", "Level 1. 1d10 damage to one target, which misses 1d4 turns."],
  ["Flash Freeze", "Level 5. Restrain a target until it rolls a DC12 Dice Challenge to break free. No damage itself, but damage dealt to it is doubled until it unfreezes."],
  ["Adrenaline", "Level 5. Gives yourself or an ally 1 Exertion Use. On an allied NPC, allows an immediate Combat Action."],
  ["Raise Dead", "Level 5. Revive a recently dead creature to serve you, keeping its stats and abilities. Lasts until its death."],
  ["Magic Shackles", "Level 5. 2d6 damage to one target every round; it needs two Tactical Actions to move. Lasts until you next take damage."],
  ["Mass Paralyse", "Level 5. 2d10 damage to d6 targets, which miss 1d4 turns."]
].map(([n, d]) => spell(n, "death", d));

const UTILITY = [
  ["Telekinesis", "Move a Nearby object with your mind: trigger traps, throw weapons, steal small items. Lasts 15 minutes."],
  ["Illuminate", "Bright light on an object or the end of your magic staff; can Blind enemies. Lasts 6 hours."],
  ["Darkness", "A fog of pure darkness around yourself or an object. Lasts 1 hour."],
  ["Lock/Unlock", "Locks or unlocks a door, chest, etc."],
  ["Magic Message", "Imbues a message or weird noise onto an object or small animal, which carries it to a designated target."],
  ["Conjure Magic Staff", "Conjures a Magic Staff. Each Spell Use spent adds one Fuck Up it can channel (3 Spell Uses = a 3 Fuck Ups staff)."],
  ["Speak with Animals", "Talk with non-humanoid creatures and gain +10 to Disposition checks with them. Lasts 24 hours."],
  ["Ten Seconds Backwards", "Reverse time 10 seconds so the last roll can be rolled again. Costs a Spell Use but can be cast as a Tactical Action."],
  ["Invisibility", "Makes an object or person invisible; attacking or sudden movement ends it. Lasts 6 hours."],
  ["Create Water", "Creates a day's water for one person in a fragile bubble. Quickly cures Burning, or can be decanted."],
  ["Cure Poison", "Cures the Poisoned status without alcohol."],
  ["Summon Tentacles", "A harmless trap that immobilises a humanoid, or 2 hours of Incredible Sex without resting for you or a target. Lasts 2 hours."],
  ["Darkvision", "See clearly in low light and Nearby in pitch black. Lasts 1 hour."],
  ["Revitalise", "Gives an ally 3 Exertion uses. Once a day per ally."],
  ["One Way Wall", "Makes the wall to the next room transparent to you; those inside don't notice."],
  ["Escape Portal", "A portal to safety, outside the dungeon or away from the area. Nearby creatures can follow. Lasts five minutes."],
  ["Tame Living Trap", "Turns a Living Trap non-hostile and hostile to your enemies. Lasts 1 hour."],
  ["Cloud of Fog", "A large cloud of impenetrable fog. Lasts five minutes."],
  ["Cheat Fate", "Modify the result of any dice roll, in or out of combat. Once a day."],
  ["Weightlessness", "Target is weightless: climbs without a Dice Challenge, +5 to Stealth, thrown back when attacked. Lasts thirty minutes."]
].map(([n, d]) => spell(n, "utility", d));

const BLOOD = [
  ["Blood Bolt", "A standard ranged magical attack. Roll two dice for the Life Lost roll; damage equals the total (a 4 and a 6 deal 14 and cost 10 LIFE)."],
  ["Blood Boost", "Adds the dice used in your Life Lost roll (not the result) to an ally's next attack, skill or spell."],
  ["Blood Heal", "Heals an allied target for the Life Lost roll."],
  ["Blood Trap", "A boiling bubble of blood on a surface; an enemy passing by or interacting with it takes damage equal to the Life Lost roll."],
  ["Blood Blush", "After a successful Stealth Check, raises a target's Disposition by the Life Lost roll for one hour; afterwards it has -10 Disposition towards you."],
  ["Blood Whip", "A sharp lashing weapon with +3 bonus damage that lasts one combat; can also catch and pull small objects."],
  ["Emergency Blood Transfer", "Source text unreadable in the OCR; verify in the book."],
  ["Blood Burst", "Needs a corpse. The rest of the source text is unreadable in the OCR (users gain a Vice, 'because it's gross'); verify in the book."]
].map(([n, d]) => spell(n, "blood", `${d} No Spell Uses or casting roll: sacrifice LIFE with up to two dice no higher than d10.`, { cost: 0, costType: "life" }));

const RITUALS = [
  ["Rejuvenate", "Ritual. Takes hours; everyone involved looks a couple of years younger."],
  ["Permanent Portal", "Ritual. Requires the sacrifice of two living people, at the same time, at either end of the portal."],
  ["Good Fortune", "Ritual. Requires the sacrifice of a living person."],
  ["Neck Suck", "Ritual, vampires only. Drains a living target's Life into your Blood Gauge (double Blood if it kills them). Not usable in combat."],
  ["Enthrall", "Ritual. Sacrifice a living person and well restrain a target: it becomes a free thrall retainer. Takes 24 hours."],
  ["Blood Scrying", "Ritual. Requires the sacrifice of a living person; ask the GM two yes or no questions."],
  ["Super Special Sacrifice", "Ritual, once only. Requires as many living sacrifices as participants, takes 24 hours. All party members Level Up; allied NPCs gain +3 Life and +1 damage."]
].map(([n, d]) => spell(n, "blood", d, { cost: 0, costType: "life" }));

const ADVANCED = [
  ["Arcane Arrow", 3, "3-10 Spell Uses. A bolt of pure magic dealing d6 damage per Spell Use, up to 10d6; can attack multiple targets."],
  ["Body Modify", 4, "Change the physical attributes of yourself or a target (sex, eye, hair and skin colour, body parts). Does not affect stats; cannot change race."],
  ["Storm Cloud", 5, "A thunderous cloud strikes enemies with lightning every round: 2d6 the first round, +1d6 each round, until combat ends."],
  ["Real Revive", 6, "Revives a target dead for no longer than three months to full health, without becoming a zombie."],
  ["Dome", 7, "A magical dome around the wizard and allies: cures status effects inside, blocks outside projectiles and magic; enemies passing in suffer 6d6. Until combat ends."],
  ["Polymorph", 8, "Turns the target into a creature of your choice, including its stat block. Reverting costs one Spell Use."],
  ["Napalm", 9, "The target takes 10d6 damage and Adjacent enemies 5d6; they Burn until they spend a Tactical Action extinguishing themselves."],
  ["Summon Spirit", 10, "Summon a ghost that adds an extra d8 to any dice rolls the target chooses, for 24 hours."],
  ["Word of Death", 12, "If the target has less than 60 Life, it dies immediately."],
  ["Bimbofication", 15, "Trade an allied player's Smarts points for Hotness points, up to -5 Smarts. Permanent."],
  ["Mountain of Muscle", 18, "Trade an allied player's Smarts points for Brawn points, up to -5 Smarts. Permanent."],
  ["Clone", 20, "An exact physical copy of the target (no spells or abilities, none of the memories). Considered extremely unethical."]
].map(([n, cost, d]) => spell(n, "advanced", `${d} Needs an equipped Magic Staff and Skimpy armour or none.`, { cost, minRank: "apprentice" }));

// ---------- Grimoires (400j each; ritual spells: cast from a book, never in combat, Skimpy armour or none) ----------
// [name, time, Spell Uses, lasts, description]
const GRIMOIRES = [
  ["Adjust Ambient Temperature", "1 hour", 10, "Until Recast", "The radiating temperature of a small object becomes scalding hot or freezing cold. Most commonly used on rocks to boil water in Dwarven water rooms."],
  ["Anthropomorphize", "2 hours", 12, "24 hours", "Gives an inanimate object sapience so it can talk. Roll a -5 Disposition check for how cooperative it is; most things don't like being alive."],
  ["Body Swap", "2 hours", 10, "Until Recast", "Swaps the consciousnesses of the caster and a target, or of two targets. Targets must be willing or incredibly restrained."],
  ["Command", "6 hours", 15, "Indefinitely", "The target obeys a single command, no matter its intelligence or how dangerous or self-destructive. Afterwards, if it can, it regains its own will."],
  ["Comprehension", "3 hours", 10, "1 hour", "Lets a target understand ciphers, old languages and schematics, as long as they aren't magically altered. The wizard can't cast it on themselves."],
  ["Disenchant", "12 hours", 20, "Indefinitely", "Removes any magical effects from an object or target. Kind of a dick move among wizards, but useful for spellbound maidens and cursed weapons."],
  ["Dairyfication", "1 hour", 15, "Indefinitely", "Turns the target into a Dairygirl (small horns, cow ears and tail). It can no longer wear Full or Fitted armour but gives a serving of milk (+1 Brawn for 24 hours) after eating four rations. Target must be a Human, Elf, Relmer or Alloyan."],
  ["Duplication", "1 hour", 10, "Indefinitely", "Creates a rubber duplicate of an object or target. Often used for acting props and sex toys."],
  ["Enter the Afterlife", "12 hours", 20, "15 minutes", "The target briefly enters one of Ninki's afterlifes. Any movement there is reflected on return to the real world, hypothetically escaping any confines."],
  ["Fat Clyd's Foggy Fart Cloud", "30 minutes", 5, "30 minutes", "An incredibly juvenile spell that fills the area with thick, foul-smelling fog that makes it impossible to see. Useful for thieves and pranksters."],
  ["Greedy Bastard", "1 hour", 8, "15 minutes", "The target becomes obsessed with jade and valuables and talks incessantly about its financial ventures. Good for forced confessions."],
  ["Gore", "4 hours", 15, "Indefinitely", "The target explodes in blood, guts and viscera; casting gradually raises the pain until it is unbearable. Great for torture, not good for drapes and carpets."],
  ["Hear Stuff", "2 hours", 8, "1 hour", "Hear even the quietest whisper within three hundred feet. Not useful in a busy area."],
  ["Hover", "1 hour", 15, "Until Recast", "The target or object floats six feet above its resting place and can't move without pushing off another object."],
  ["Ice Cold", "30 minutes", 6, "15 minutes", "Objects the caster touches become sheathed in a thin layer of ice. Useful for creating difficult terrain or serving drinks."],
  ["Illusion", "30 minutes", 6, "15 minutes", "A harmless, inanimate visual illusion of the caster's choice that dissipates when touched. Great for frightening old people."],
  ["Imagination", "2 hours", 8, "1 hour", "Forces a target to vividly picture everything described to them, and the consequences. Great for storytelling, seducing and torture."],
  ["Invisible Wall", "3 hours", 15, "Until Recast", "An invisible wall between two predetermined points; the caster must see both points at once."],
  ["Knock", "1-6 hours", 12, "Until Recast", "Locks or unlocks a door. More complex locks take more time, not more Spell Uses. Lockpicks can still work on it but take the same time."],
  ["Lovely Little Cottage", "3 hours", 20, "24 hours", "A portal opens to a furnished countryside cottage with food, drink, a bath and a suspiciously adorable grandma of the caster's race, and closes after 30 seconds. All occupants MUST leave within 24 hours or suffer the consequences; the portal reopens at its original location."],
  ["Magic Mirror", "6 hours", 20, "Indefinitely", "Turns two normal mirrors into magic mirrors that objects and, if large enough, people can pass through. With only one mirror it leads to an unknown magic mirror, usually in the bedroom of an incredibly angry wizard."],
  ["Miniaturize", "2 hours", 8, "1 hour", "The caster and any nearby targets become the size of a beer bottle; gear and clothes shrink with them."],
  ["Nick", "15 minutes", 4, "Indefinitely", "An object the caster can see teleports into their hand, along with anything it is attached to or resting on."],
  ["Objectification", "3 hours", 16, "Until Recast", "The target becomes an inanimate object of the caster's choice. It can still hear, see and feel but can't talk or move."],
  ["Pacification", "6 hours", 12, "Until Recast", "The target becomes permanently non-hostile to all living creatures and won't defend itself if attacked."],
  ["Piss", "15 minutes", 5, "15 minutes", "Forms a torrential rain cloud of fragrant dark urine. Good against fires, but causes Filthy."],
  ["Pit", "1 hour", 6, "Indefinitely", "Creates a hole in the ground the size of an average burial: 6 feet deep, 3 wide, 6 long."],
  ["Prestidigitation", "5 minutes", 1, "30 seconds", "A harmless illusory effect such as coloured sparks, a card trick or a glowing word. No one is impressed because you're reading it out of a book."],
  ["Quim", "15 minutes", 2, "Indefinitely", "Creates an impressively realistic Relmeran vagina on an inanimate object. Wizards get lonely."],
  ["Read Mind", "1 hour", 15, "15 minutes", "The caster reads the target's thoughts; the target is aware of it."],
  ["Rough Resurrection", "6 hours", 16, "Indefinitely", "Revives a target dead within 24 hours with 1 Life (it can't be a zombie). The target receives d6 Vices, rerolling duplicates. Not fun for anyone involved."],
  ["Silence", "2 hours", 8, "1 hour", "A bubble of silence around the caster or a target. Great for stealth."],
  ["Speak with Dead", "30 minutes", 6, "15 minutes", "Speak with a corpse that died within the year. Requires a Disposition check."],
  ["Summon Imp", "1 hour", 8, "6 hours", "Summons a bright red, horned lesser fae the size of a human newborn with a prehensile tail. It begrudgingly obeys but can't fight."],
  ["Summon 'Cubus", "1 hour", 12, "2 hours", "Summons a lesser fae similar to an Otherling with pure black eyes, terrifyingly seductive. It starts fucking everyone in sight, switching body shape as needed. A great distraction."],
  ["Telepathy", "1 hour", 10, "15 minutes", "Projects the caster's thoughts into a target's mind as if they were its own. Useful for making idiots rethink dumb ideas."],
  ["Truth", "30 minutes", 3, "15 minutes", "Detects whether someone is lying, assuming their mind isn't magically protected."],
  ["Uvula", "15 minutes", 2, "Indefinitely", "Creates a functioning mouth, tongue and throat on an object. It can sing, shout, tell jokes, and suck."],
  ["Vision", "15 minutes", 4, "Until Recast", "Creates an eyeball on an inanimate object that the caster sees through at any distance, in addition to their own eyes. It can't be closed."],
  ["Ward", "15 minutes", 10, "3 hours", "A 30 feet circle around the caster. Name up to five things; all instances of them cannot cross the circle (for instance crossbow bolts)."]
].map(([n, time, cost, lasts, d]) => spell(n, "grimoire", `Grimoire (400j). Requires: ${time}, ${cost} Spell Uses. Lasts: ${lasts}. ${d} Cast from a book: not usable in combat; Skimpy armour or none; if the caster joins combat the spell is interrupted.`, { cost }));

// ---------- Classes ----------
const klass = (name, classType, desc) => ["classes", name, "class", { classType, learningLevel: 0, skills: "" }, desc];
const CLASSES = [
  klass("Bard", "bard", "Bard Proficiency 1-20 gives a +1 to +7 modifier (every 3 points). Raised by performing at venues (x2 to x4) or Bard Practice. Songs cost a Tactical Action to sing each round: Charm (DC 10+mod), damage, healing, Sex/Moxie bonus, Stealth/blind, Dancer damage, raise a Downed ally."),
  klass("Dancer", "dancer", "Needs Skimpy armour. Learned in Downtime sessions. Use Hotness instead of Brawn/Smarts, reduced falling damage, +d4 melee damage, move away without Opportunity Attacks, Cleave, dodge and counter-attack. Needs a Staff, Magic Staff, Spear or Halberd for some skills."),
  klass("Fighter", "fighter", "Learned at city Arenas. Tiers 1-4 unlock 3/5/7/9 skills: Bulwark, Skirmisher (two weapons), Loud, Berserker, Spellsword, Knightly, Second Wind (Brawn x Moxie LIFE), Roar and more. Martial Skills (DC 14+Brawn): Taunt, Protect, Cleave, Stab, Lunge."),
  klass("Thief", "thief", "Thieves Guild. Skills in any order: Silent, Backstab, Acrobat, Skillful Fingers (+8), Thieves' Slang, Alert (+10), Hide, Trusted Fence and more."),
  klass("Paladin", "paladin", "Temple of T'hot. Takes Vows (never revocable). 3 Vows: Sense Magic; 5: Valet; 7: Fitted Armour; 9: Spellsaber. Justice, Purity, Honour, Duty and others. Breaking a Vow means permanent expulsion."),
  klass("Cleric", "cleric", "Empowered by holy relics of T'hot (healing), Grod (Full armour, melee), Gap'r (Hotness for magic) or Dirrei. Relics cost 100-500j each."),
  klass("Warlock", "warlock", "Taken on the third turn of being Downed: revive with full Life, Spell Uses and Exertion and roll a Patron (d6). Each Level Up grants the Patron's Boon and Bane and -1 Disposition; abilities every 2 level-ups."),
  klass("Wizard", "wizard", "learningLevel 1-6: Novice (3 spells, +4 Spell Uses), Apprentice (5 spells, 1 Advanced Spell, Wizard's Hat), Journeyman (7, +5 Uses, no more experiments), Adept (9, +5), Wizard (11, +5, cast on a roll of 6+), Master (13, +6, no casting roll)."),
  klass("Blood Magic", "blood", "Learned by Downtime with a local cult. Blood Magic needs no Spell Uses or casting roll and can be cast in up to Medium armour. Vampires gain passive abilities with 2, 4, 6 and 8 spells known.")
];

// ---------- Feats: what each class grants (names marked * come from badly OCR'd headings; verify in the book) ----------
const feat = (name, classType, requirement, desc) => ["feats", name, "feat", { classType, requirement }, desc];
const FEATS = [
  // Bard: songs cost a Tactical Action each round to keep singing; Bard Proficiency modifier (+1 at 1-3 ... +7 at 19-20) scales them.
  feat("The One About the Three Legged Bard*", "bard", "Song", "Target suffers Charmed, escape DC 10 + Proficiency Modifier. Once per combat per target; only while the song is sung."),
  feat("The One About the Fucking Dumbass", "bard", "Song", "Deals damage equal to the Proficiency Modifier to one target every round it is sung. The target must beat DC 10 + modifier to attack the Bard; after that it is immune for the encounter."),
  feat("The One About the Fair Maiden", "bard", "Song", "Heals one ally, or splits the Proficiency Modifier among several, every round it is sung. Out of combat only once while the party rests."),
  feat("The One About Fucking the Dragon", "bard", "Song", "Adds the Proficiency Modifier to all Sex rolls of the Bard or a nearby ally; in combat gives an ally +modifier Moxie for one round (once per encounter)."),
  feat("The One About Stubbing Your Toe", "bard", "Song", "Allies in the area add the Proficiency Modifier to Stealth; enemies are blinded and deafened while it plays. After a successful sneak they hunt whoever made the noise."),
  feat("The One About the Deadly Dancer", "bard", "Song", "Adds the Proficiency Modifier to an allied Dancer's damage; out of combat adds it to Hotness checks of allies of any class."),
  feat("The One About Getting Back Up*", "bard", "Song", "Once per combat heals a Downed target for double the Proficiency Modifier; a formerly hostile target becomes non-hostile and gains that much Disposition."),
  // Dancer: bought with Downtime sessions; all need Skimpy armour.
  feat("Dancer in Training*", "dancer", "1 session", "Dance alongside a Bard during their Downtime performance to add 2d100j to their earnings."),
  feat("Gorgeous*", "dancer", "2 sessions", "In Skimpy armour use Hotness for attacks instead of Brawn."),
  feat("Nimble*", "dancer", "3 sessions", "In Skimpy armour subtract d6 from falling damage (falling prone, heights, Difficult Terrain)."),
  feat("Dagger Heels*", "dancer", "4 sessions", "In Skimpy armour add d4 to a melee attack by spending a Tactical Action, once per turn."),
  feat("Dance Partner", "dancer", "2 sessions", "You and an allied Bard can use each other as Mounts regardless of Brawn."),
  feat("Pole Work*", "dancer", "1 session", "In Skimpy armour with a Staff, Magic Staff, Spear or Halberd: +1 to all melee damage."),
  feat("Spellcaster's Sway*", "dancer", "5 sessions", "In Skimpy armour use Hotness to cast spells instead of Smarts."),
  feat("Evasive Step*", "dancer", "3 sessions", "In Skimpy armour with a polearm or staff: move away from one Adjacent enemy without an Opportunity Attack by spending 2 Tactical Actions; +1 Exertion; against 2+ enemies subtract 1 Opportunity Attack."),
  feat("Spin*", "dancer", "4 sessions", "In Skimpy armour with a polearm or staff: use Cleave as a Tactical Action, once per turn."),
  feat("Whirling Dervish*", "dancer", "5 sessions", "In Skimpy armour with a polearm or staff: when you spend Exertion to dodge a melee attack you immediately make a basic melee attack against the attacker."),
  // Fighter: Tier 1 = 3 skills, Tier 2 = 5, Tier 3 = 7, Tier 4 = 9.
  feat("Bulwark", "fighter", "Tier 1", "Using a Heavy Shield no longer costs a Tactical Action."),
  feat("Skirmisher*", "fighter", "Tier 1", "Wield a one-handed (up to d10) weapon in each hand: a second basic attack for half damage in the same Combat Action."),
  feat("Loud", "fighter", "Tier 2", "Taunting always forces four enemies to attack the Fighter on their turn (all of them if fewer)."),
  feat("Berserker", "fighter", "Tier 2", "Double the Fighter's added Brawn damage with a two-handed (above d8) weapon."),
  feat("Spellsword", "fighter", "Tier 2", "Two spell slots: a Level 1 Light or Death spell of your choice, and Brawn instead of Smarts to cast."),
  feat("Body Club*", "fighter", "Tier 2", "Use a humanoid enemy with less current Life as an improvised weapon: d10 + Brawn damage dealt to both the enemy used and the target. DC 12 to wriggle away."),
  feat("Knightly*", "fighter", "Tier 3", "In Full or Fitted armour use Brawn or Moxie instead of Hotness for Disposition checks; the Protect skill needs no Dice Challenge and only 1 Tactical Action."),
  feat("Fleetfoot*", "fighter", "Tier 3", "In Skimpy or Light armour, moving does not cost a Tactical Action."),
  feat("Roar", "fighter", "Tier 4", "Spend 1 Exertion to intimidate injured humanoid enemies into becoming non-hostile (DC 14 to resist, or GM's discretion)."),
  feat("Second Wind", "fighter", "Tier 4", "In Medium armour spend 1 Exertion to heal Life equal to Brawn x Moxie."),
  feat("One-Handed Hold*", "fighter", "Tier 4", "Restrain one humanoid enemy with one hand while attacking with the other, using one Combat Action (DC 12 to wriggle free). While Brawling you deal double Brawn damage with fists or improvised weapons."),
  // Martial Skills (learned at Arenas, DC 14 + Brawn; any class can learn them)
  feat("Taunt", "martial", "Martial Skill", "Goads d4 enemies into attacking you. Causes no damage. If the first target is killed, excess carries to the next."),
  feat("Protect", "martial", "Martial Skill", "Take any damage aimed at an ally. Can be used alongside a Combat Action."),
  // Thief: any order, one per Downtime session. Most need Skimpy or Light armour.
  feat("Silent*", "thief", "Thief skill", "In Skimpy or Light armour you do not add your armour to Stealth checks."),
  feat("Backstab*", "thief", "Thief skill", "Daggers and short swords deal double damage against an enemy that attacked someone other than you this round."),
  feat("Peek*", "thief", "Thief skill", "In Skimpy or Light armour, peek through normal doors without a Stealth check."),
  feat("Acrobat", "thief", "Thief skill", "In Skimpy or Light armour, climbing man-made surfaces needs no rope or Moxie check."),
  feat("Rope Daggers", "thief", "Thief skill", "Use daggers and short swords as ranged attacks on special elastic ropes; can also act as a grappling hook."),
  feat("Slippery*", "thief", "Thief skill", "In Skimpy or Light armour, +5 to escape from being Restrained."),
  feat("Skillful Fingers", "thief", "Thief skill", "In Skimpy or Light armour, +8 to lockpicking and to disarming mechanical traps."),
  feat("Light Fingers*", "thief", "Thief skill", "In Skimpy or Light armour, +5 to pickpocket with a Stealth check."),
  feat("Alert", "thief", "Thief skill", "+10 to Smarts checks listening for unusual noises, searching a room for specific objects or watching for ambushes."),
  feat("Hide", "thief", "Thief skill", "In Skimpy or Light armour, hide and move silently in darkness without a Stealth check; interacting or ambushing still needs one."),
  feat("Thieves' Slang", "thief", "Thief skill", "Talk with fellow thieves about fencing, theft opportunities, schematics and weak spots without raising suspicion."),
  feat("Mimic Master", "thief", "Thief skill", "Instantly tell when a chest is a Treasure Mimic, and tickle it so it vomits up its valuables."),
  feat("Underworld Contacts*", "thief", "Thief skill", "Hire one Thief, Strumpet or Mercenary without paying for their services."),
  feat("Trusted Fence", "thief", "Thief skill", "Add d50 jade to the sale value of every Treasure or Magic Item you sell at a Pawn Shop."),
  // Paladin: Vows can never be revoked; breaking one means expulsion from the Temple.
  feat("Vow of Justice", "paladin", "Vow", "Aim to do good and work against selfishness and tyranny. Every Level Up gain +2 Spell Uses in addition to your normal choices."),
  feat("Vow of Purity", "paladin", "Vow", "Avoid Death, Blood and Primordial magic; use only Light magic. You never roll to cast Heal or Group Heal."),
  feat("Vow of Charity", "paladin", "Vow", "Give any jade beyond 200 to those in need. +4 Disposition with humanoids; you and your party attend Academic and Magical lectures free."),
  feat("Vow of Chastity", "paladin", "Vow", "Never have sex as distraction, trickery or negotiation."),
  feat("Vow of Honour", "paladin", "Vow", "Never return as a zombie. +1 Moxie every Level Up; once per combat, when you would drop to 0 Life you keep 1 Life and stay conscious."),
  feat("Vow of Duty", "paladin", "Vow", "Avoid quests and coin from the extremely wealthy. Cast Shield as a Tactical Action, once per turn."),
  feat("Endowment: Sponsored", "paladin", "1 Vow", "The Temple gives you 200j a week for expenses."),
  feat("Endowment: Sense Magic", "paladin", "3 Vows", "A crystal glows when Death, Blood or Primordial magic is used nearby; the GM must answer truthfully."),
  feat("Endowment: Valet", "paladin", "5 Vows", "A temple novice accompanies you as a Retainer, paid by the Temple."),
  feat("Endowment: Armour", "paladin", "7 Vows", "A suit of Fitted Armour (2d6 armour save)."),
  feat("Endowment: Sacred Spellsaber", "paladin", "9 Vows", "Cast all Light Magic without rolling, and gain the Real Revive Advanced Spell."),
  // Cleric: power comes from holy relics bought with jade.
  feat("T'hot: Dragongold Earrings", "cleric", "150j", "Semi-Genuine Dragongold Earrings: +2 Smarts."),
  feat("T'hot: Bikini Gold Armour", "cleric", "300j", "Medium armour (d6+1 save) that gives +2 Spell Uses."),
  feat("T'hot: Strand of Hair", "cleric", "500j", "In Medium armour, cast Heal or Group Heal as a Tactical Action."),
  feat("T'hot: Holy Relic", "cleric", "100j each", "Each additional relic adds +1 to the effect of healing spells."),
  feat("Grod: Poetry Collection", "cleric", "200j", "In Full armour, gain +1 Tactical Action in a turn."),
  feat("Grod: Combat Sweat", "cleric", "250j", "In Full armour, dealing damage heals you or an ally for 1 point."),
  feat("Grod: Holy Relic", "cleric", "250j each", "Each additional relic adds +1 to melee attack damage."),
  feat("Gap'r: Finger Bone", "cleric", "400j", "In Medium armour, cast Light Magic and Utility spells with Hotness instead of Smarts."),
  feat("Gap'r: Holy Vial of Fuck Slime", "cleric", "500j", "In Medium armour, cast Heal as a Tactical Action, and cast Tame Living Trap and Speak with Animals without rolling."),
  feat("Gap'r: Holy Relic", "cleric", "100j each", "Each additional relic adds +1 Spell Uses."),
  // Warlock: each Patron grants a Boon and a Bane every Level Up, plus abilities every 2 level-ups. Cumulative -1 Disposition per Level Up.
  feat("Antler Man: Endless Inquisitive*", "warlock", "2 Level Ups", "Reroll any out-of-combat Smarts Dice Challenge, such as lockpicking."),
  feat("Antler Man: Unfinished Business*", "warlock", "4 Level Ups", "Once per 24 hours, get back up with 1 Life after being Downed."),
  feat("Antler Man: Derisive Duellist*", "warlock", "6 Level Ups", "Use Smarts when attacking or defending instead of Brawn or Moxie."),
  feat("Faerie King: Noble Steed*", "warlock", "2 Level Ups", "While mounted on a Mountable Creature or fellow adventurer, melee attacks deal +d6 damage."),
  feat("Faerie King: Duty Bound*", "warlock", "4 Level Ups", "Learn Taunt and Protect, rolling with Hotness instead of Moxie."),
  feat("Faerie King: Gallant Knight*", "warlock", "6 Level Ups", "Use Hotness instead of Moxie for Armour Saves."),
  feat("Sand Witch: Piggy Back*", "warlock", "2 Level Ups", "Act as a Mount for one allied adventurer regardless of size or Brawn."),
  feat("Sand Witch: Bacon Sandwich*", "warlock", "4 Level Ups", "Eat 3 rations with a Tactical Action to regain 1 Exertion in combat."),
  feat("Sand Witch: Rampant Rabbit*", "warlock", "6 Level Ups", "Spend two Exertion uses to take another turn immediately, refreshing Combat and Tactical Actions."),
  feat("Cowled Lady: Finishing Blow*", "warlock", "2 Level Ups", "If you down an enemy you may kill them immediately without using a Combat Action."),
  feat("Cowled Lady: Kill Streak*", "warlock", "4 Level Ups", "Immune to Berserk; you may become Berserk at will and end it at will."),
  feat("Cowled Lady: Kill Them All*", "warlock", "6 Level Ups", "If you down an enemy you regain your Combat Action and may use it immediately."),
  feat("Jovial Fellow: Drunken Genius*", "warlock", "2 Level Ups", "Being Drunk no longer raises Dice Challenges by +3; instead it lowers them by 2."),
  feat("Jovial Fellow: Heavy Hitter*", "warlock", "4 Level Ups", "Attacks that would move you still do damage but you stay in place."),
  feat("Jovial Fellow: Healing Sponge*", "warlock", "6 Level Ups", "Add d6 Life to all healing you receive (potions, spells, sex)."),
  feat("Mad Stray: Glowing Green Eyes", "warlock", "2 Level Ups", "Your eyes act as a light source like a lantern or torch; when open they hurt the party's Stealth."),
  feat("Mad Stray: Creating Fate*", "warlock", "4 Level Ups", "Learn Cheat Fate; it costs 10 Spell Uses and works on any DC roll, even other adventurers'."),
  feat("Mad Stray: Distorted Destiny", "warlock", "6 Level Ups", "Spend Spell Uses to add +2 each to a Dice Challenge you roll."),
  // Wizard ranks and Blood Mage / Vampire passives
  feat("Wizard Novice", "wizard", "Rank 1", "Three Spells Known; gain 4 Spell Uses."),
  feat("Wizard Apprentice", "wizard", "Rank 2", "Five Spells Known; one Advanced Spell and your own Wizard's Hat. No extra Spell Uses."),
  feat("Wizard Journeyman", "wizard", "Rank 3", "Seven Spells Known; +5 Spell Uses and one Advanced Spell; no more experiments to learn spells."),
  feat("Wizard Adept", "wizard", "Rank 4", "Nine Spells Known; +5 Spell Uses and one Advanced Spell."),
  feat("Wizard", "wizard", "Rank 5", "Eleven Spells Known; +5 Spell Uses and one Advanced Spell; you only need 6 or higher to cast (Fuck Ups below 6 you removed stay removed)."),
  feat("Wizard Master", "wizard", "Rank 6", "Thirteen Spells Known; +6 Spell Uses and one Advanced Spell; no casting roll (you still need a Magic Staff for Advanced Spells)."),
  feat("Vampire: Immortal", "blood", "2 Blood Spells", "Cannot die from Starvation or Dehydration (minimums: 1 Life, -6 Moxie). On the Dead table rolling 16+, you stand back up with 50% Life and a full Blood Gauge instead of becoming a zombie."),
  feat("Vampire: Blood Puddle", "blood", "4 Blood Spells", "Dissolve into a puddle of blood for up to 30 minutes, unharmable; you emerge with 1 Life and naked."),
  feat("Vampire: Eerie Charisma", "blood", "6 Blood Spells", "Immune to Charmed and to Horny."),
  feat("Vampire: Lord of Blood", "blood", "8 Blood Spells", "Cast Blood Magic in Full or Fitted armour, and perform the Enthrall ritual without a sacrifice by spending 50 Blood Points.")
];

// ---------- Roll tables ----------
// Adventuring Supplies (d100): every adventurer rolls it six times at creation. Pets (d6): result 100 on the supplies table.
const SUPPLIES = [
  "A Sapiavian Feather", "30ft of good rope", "A dusty bottle of rum", "The pelt of a Coxox", "A quill and ink",
  "A jar of Slugraptor slime", "A Wyrmswurm bagpipe guitar", "A rusty Bullbear Trap", "A large tin of choplate chip cookies", "Rumpled love letters",
  "A human femur", "Several sets of spare earrings", "A jar of rumprat poison", "A barmaid's bra", "A wooden prosthetic arm",
  "A small joke book", "15 feet of sturdy bronze chain", "A crowbar", "Spare underwear", "A scroll titled \"How to Make Friends\"",
  "6 Lockpicks", "A fake moustache", "A vial of pink lipstick", "A lantern and oil", "A bag of ball bearings",
  "A spare leather choker", "A pair of handcuffs", "A glass poison gas trap", "A Dragonmarrow harmonica", "A selection of friendship bracelets",
  "A small urn", "10 sheets of blank parchment", "A balloon of Hermaphryena semen", "A tinderbox", "A six hour hourglass",
  "A Longleopard stringgut violin", "A tin of Bastardgrass", "A severely dented bronze helmet", "A threenut butter and jelly sandwich", "A small forearm shield (+1 Moxie)",
  "A deck of playing cards", "Three scented candles", "A pot of Phallungus fungus", "A pair of high heels", "4 servings of Dairygirl milk (+1 Brawn)",
  "A small faded painting", "A gold locket", "A still-talking zombie head", "A revealing silk outfit (+1 Hotness)", "A set of flammable juggling pins",
  "A note describing your mother", "An invitation to the island of Shagahol", "A magnifying glass", "A vial of strong acid", "A box of coloured chalk",
  "A wooden key harp", "A leaf from the Bone Forest", "A fishing rod and a tin of worms", "A rain catching funnel", "A famous warrior's autobiography",
  "A chit for a free beer at a local brothel", "A purse of d100 extra jade", "A VIP Pass to Shuvitinabuti's breeding program", "A pair of reading glasses", "An Orc tusk",
  "5 poison darts", "A note from a former teacher saying \"See Me\"", "A diamond glass cutter", "Several final notice debt letters", "A stripper's pasties",
  "A compass", "A wooden wedding ring", "A half empty bottle of banana daiquiri", "A metal file", "A bag of caltrops",
  "A ball of yarn", "A set of house keys", "A pirate's red bandana", "The loin cloth of a Rimnori elf", "A sketchbook of pornographic drawings",
  "A skinning knife (+1 Meat from dead animals)", "Several of your own teeth", "A hackey sack", "An arena blood sponge", "A former lover's favourite tunic",
  "4 vials of Antidote", "A pack of bubblegum", "A voucher for a free Blood Magic Spell", "A snare trap", "A straight razor and shaving kit",
  "A hand carved bong", "3 pinches of Whiffsniff (+1 Exertion per use)", "Leather reins and a saddle", "A small mirror", "A very harshly worded employee evaluation",
  "A sealed envelope from a local cult", "A gentleman's sexual relief appliance", "A hammer and bag of nails", "d10 extra rations", "A pet (roll a d6 on the Pets table)"
];
const PETS = [
  "A Splatcat: an extremely fluffy, extremely pudgy, six legged cat. Basically useless.",
  "A Squish: a ball of slime with eyes that can fit through the smallest cracks.",
  "A Minimimic: a pygmy mimic that can morph into objects as large as a bowling ball.",
  "A Nightwoofer: a nocturnal lemur-like creature that barks like a dog when frightened.",
  "A Sapiavian: a small talking bird with the intelligence of a person.",
  "A Crapdragon: a tiny dragon that breathes fire hot enough to melt iron, eventually."
];

/** RollTable source documents (results embedded, text in `description` as v14 stores text results). */
const table = (name, formula, description, texts) => {
  const _id = stableId(`tables:${name}`);
  return {
    _id,
    _key: `!tables!${_id}`,
    name,
    formula,
    description: para(description),
    img: "icons/svg/d20-black.svg",
    replacement: true,
    displayRoll: true,
    results: texts.map((text, i) => {
      const rid = stableId(`tables:${name}:${i + 1}`);
      return {
        _id: rid,
        _key: `!tables.results!${_id}.${rid}`,
        type: "text",
        name: "",
        description: para(text),
        img: "icons/svg/d20-black.svg",
        weight: 1,
        range: [i + 1, i + 1],
        drawn: false,
        flags: {}
      };
    }),
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {}
  };
};
const FUCK_UPS = Array.from({ length: 11 }, (_, i) => LANG[`VV.FuckUp.${i + 1}`]);
const TABLES = [
  table("Adventuring Supplies", "1d100", "Every adventurer starts with four days of food and water, a simple tent and bedroll, and d10 x 10 jade. Roll a d100 six times to determine the rest of your adventuring supplies.", SUPPLIES),
  table("Fuck Up Table", "1d11", "When a Light, Death or Advanced spell fails to cast, the failed total picks the effect (1 to 11). A Magic Staff charge or a result you turned into a cast prevents it.", FUCK_UPS),
  table("Pets", "1d6", "Result 100 on the Adventuring Supplies table: roll a d6 to see which pet you get.", PETS)
];

// ---------- Creatures (NPC actors) ----------
// Only what the book states about mimics (Treasure Mimic rules, Minimimic pet, Personal Pet Mimic). No invented stat block.
const IMG = "systems/vice-and-violence/assets/treasure-mimic.png";
const npc = (name, notes) => {
  const _id = stableId(`actors:${name}`);
  return {
    _id, _key: `!actors!${_id}`, name, type: "npc", img: IMG,
    system: { initiative: "reactive", attackDie: "d4", disposition: 0, backgroundNotes: notes },
    prototypeToken: { name, texture: { src: IMG }, width: 1, height: 1, disposition: 0, actorLink: false },
    items: [], effects: [], folder: null, sort: 0, ownership: { default: 0 }, flags: {}
  };
};
const ACTORS = [
  npc("Treasure Mimic", [
    "The most common sort of mimic: shapeshifts into chests and cupboards, and lays eggs in whoever trespasses. Practically impervious to damage (the GM may reward creative attempts to kill one).",
    "Rolled on the Loot Table: the player who rolled it is captured. Roll d8 for Time Lost and d8 for Repercussions (cumulative). Roll Wanderers if it takes more than an hour.",
    "As a pet: doesn't engage in combat; holds valuables, spare gear and up to 50 rations and water; takes 1 carrying capacity on a mount and can't ride alone (Slugraptors and Swamp Striders can't carry it); alerts a sleeping party of intruders; fits through a Magic Mirror; one person can hide inside it. Sex with a mimic once every 48 hours (roll Time Lost instead of Time Taken), leaving 1 egg inside for 24 hours. Eggs sell for 30j each.",
    "Personal Pet Mimic (Wizard service, 800j): carries 30 food and 30 rations, can act as a mount for 1 person, and gives the benefits of Incredible Sex every 24 hours.",
    "Minimimic (starting pet): a pygmy mimic that can morph into objects as large as a bowling ball."
  ].map(t => `<p>${esc(t)}</p>`).join(""))
];

export const PACKS = {
  races: { label: "Races", items: RACES.map(([name, m, desc]) => ["races", name, "race", m, desc]) },
  birthsigns: {
    label: "Birthsigns",
    items: BIRTHSIGNS.map(([name, a, b], i) => ["birthsigns", name, "birthsign", { boonA: a, boonB: b, chosen: "" }, `d6 result ${i + 1}. Choose one Boon: ${a}, or ${b}.`])
  },
  weapons: { label: "Weapons", items: WEAPONS },
  armours: { label: "Armours", items: ARMOURS },
  spells: { label: "Spells", items: [...LIGHT, ...DEATH, ...UTILITY, ...BLOOD, ...RITUALS, ...ADVANCED] },
  grimoires: { label: "Grimoires", items: GRIMOIRES },
  classes: { label: "Classes", items: CLASSES },
  feats: { label: "Class Feats", items: FEATS },
  tables: { label: "Roll Tables", docs: TABLES },
  creatures: { label: "Creatures", docs: ACTORS }
};

/** Foundry documents per pack, ready to be written as JSON sources. */
export const buildDocuments = () =>
  Object.fromEntries(Object.entries(PACKS).map(([pack, { items, docs }]) => [pack, docs ?? items.map(args => entry(...args))]));
